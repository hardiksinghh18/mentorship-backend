

const { Op } = require('sequelize');
const User = require('../models/User');
const MentorshipRequest = require('../models/MentorshipRequest');
const embeddingService = require('../services/embeddingService');

// Simple in-memory cache for queries
const matchesCache = new Map();
const usersCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

// Export caches for invalidation from other controllers
exports.matchesCache = matchesCache;
exports.usersCache = usersCache;

exports.fetchAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { role, name, skills, currentUserId, minExperience, connectionStatus } = req.query;
    console.log("Fetching users with filters:", { role, name, skills, currentUserId, minExperience, connectionStatus });

    // Check in-memory cache first
    const cacheKey = `users_${currentUserId || 'anon'}_p${page}_l${limit}_r${role || ''}_n${name || ''}_s${skills || ''}_e${minExperience || ''}_cs${connectionStatus || ''}`;
    const cached = usersCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return res.status(200).json(cached.data);
    }

    const sequelize = User.sequelize;
    const where = {
      role: { [Op.ne]: null },
      bio: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
      [Op.and]: [
        sequelize.where(sequelize.fn('json_array_length', sequelize.col('skills')), { [Op.gt]: 0 }),
        sequelize.where(sequelize.fn('json_array_length', sequelize.col('education')), { [Op.gt]: 0 }),
        sequelize.where(sequelize.fn('json_array_length', sequelize.col('experience')), { [Op.gt]: 0 })
      ]
    };

    // Exclude current user if ID is provided
    if (currentUserId) {
      where.id = { [Op.ne]: currentUserId };
    }

    if (role && role !== "" && role !== "All Members") {
      where.role = role;
    }

    if (name && name.trim() !== "") {
      const searchVal = name.trim();
      where[Op.or] = [
        { fullName: { [Op.like]: `%${searchVal}%` } },
        { username: { [Op.like]: `%${searchVal}%` } }
      ];
    }

    if (skills && skills.trim() !== "") {
      const skillsArray = skills.split(',').map(s => s.trim().toLowerCase()).filter(s => s !== "");
      if (skillsArray.length > 0) {
        const User = require('../models/User'); // Ensure access to sequelize
        const sequelize = User.sequelize;

        where[Op.and] = where[Op.and] || [];
        where[Op.and].push({
          [Op.or]: skillsArray.map(skill => (
            sequelize.where(
              sequelize.fn('LOWER', sequelize.cast(sequelize.col('skills'), 'TEXT')),
              { [Op.like]: `%${skill}%` }
            )
          ))
        });
      }
    }

    if (minExperience) {
      const exp = parseInt(minExperience);
      if (!isNaN(exp)) {
        where.yearsOfExperience = { [Op.gte]: exp };
      }
    }

    if (connectionStatus && connectionStatus !== 'all' && currentUserId) {
      const User = require('../models/User'); // Ensure access to sequelize
      const sequelize = User.sequelize;

      // Use a more robust way to merge connection status into where clause
      where[Op.and] = where[Op.and] || [];

      if (connectionStatus === 'connected') {
        where[Op.and].push({
          [Op.or]: [
            { id: { [Op.in]: sequelize.literal(`(SELECT receiverId FROM MentorshipRequests WHERE senderId = '${currentUserId}' AND status = 'accepted')`) } },
            { id: { [Op.in]: sequelize.literal(`(SELECT senderId FROM MentorshipRequests WHERE receiverId = '${currentUserId}' AND status = 'accepted')`) } }
          ]
        });
      } else if (connectionStatus === 'pending') {
        where[Op.and].push({
          [Op.or]: [
            { id: { [Op.in]: sequelize.literal(`(SELECT receiverId FROM MentorshipRequests WHERE senderId = '${currentUserId}' AND status = 'pending')`) } },
            { id: { [Op.in]: sequelize.literal(`(SELECT senderId FROM MentorshipRequests WHERE receiverId = '${currentUserId}' AND status = 'pending')`) } }
          ]
        });
      } else if (connectionStatus === 'not_connected') {
        // Exclude anyone with an active (accepted or pending) relationship
        where[Op.and].push({
          id: {
            [Op.and]: [
              { [Op.notIn]: sequelize.literal(`(SELECT CASE WHEN senderId = '${currentUserId}' THEN receiverId ELSE senderId END FROM MentorshipRequests WHERE (senderId = '${currentUserId}' OR receiverId = '${currentUserId}') AND status IN ('accepted', 'pending'))`) }
            ]
          }
        });
      }
    }

    console.log("Generated WHERE clause:", JSON.stringify(where, null, 2));

    // Fetch current user and embedding first to use in database-level vector operations
    let currentUser = null;
    let currentUserEmbedding = null;
    if (currentUserId) {
      try {
        currentUser = await User.findByPk(currentUserId);
        if (currentUser && currentUser.profileEmbedding) {
          currentUserEmbedding = typeof currentUser.profileEmbedding === 'string'
            ? JSON.parse(currentUser.profileEmbedding)
            : currentUser.profileEmbedding;
        }
      } catch (err) {
        console.error("Failed to load current user embedding:", err.message);
      }
    }

    const queryOptions = {
      where,
      attributes: {
        exclude: ['password'],
        include: []
      },
      limit,
      offset,
      include: [
        {
          model: MentorshipRequest,
          as: 'sentRequests', // Include sent requests
          where: { status: { [Op.ne]: 'declined' } }, // Filter to exclude declined requests, if needed
          required: false, // Optional: If you want users with no connections to appear as well
        },
        {
          model: MentorshipRequest,
          as: 'receivedRequests', // Include received requests
          where: { status: { [Op.ne]: 'declined' } }, // Filter to exclude declined requests, if needed
          required: false, // Optional: If you want users with no connections to appear as well
        },
      ],
    };

    if (currentUserEmbedding && Array.isArray(currentUserEmbedding)) {
      queryOptions.attributes.include.push([
        sequelize.literal(`1 - ("profileEmbedding" <=> '[${currentUserEmbedding.join(',')}]'::vector)`),
        'semanticSim'
      ]);
    }

    const { count, rows: users } = await User.findAndCountAll(queryOptions);

    // Compute dynamic AI similarity metadata for the current user against returned candidates
    let usersWithAI = [];
    if (currentUserId && currentUser) {
      try {
        for (const candidate of users) {
          const userJson = candidate.toJSON ? candidate.toJSON() : candidate;

          // Only calculate similarity if the current user has a valid profile embedding
          if (currentUserEmbedding) {
            const isPeer = currentUser.role === userJson.role;
            const dbSemanticSim = candidate.getDataValue ? candidate.getDataValue('semanticSim') : null;
            const semanticSim = dbSemanticSim !== null && !isNaN(dbSemanticSim)
              ? parseFloat(dbSemanticSim)
              : 0.50; // Fallback

            const expScore = calculateExperienceScore(
              currentUser.yearsOfExperience || 0,
              userJson.yearsOfExperience || 0,
              isPeer
            );

              const skillScore = calculateSkillScore(
                currentUser.skills,
                userJson.skills,
                isPeer
              );

              let compatibilityScore = 0;
              let matchType = '';

              if (isPeer) {
                compatibilityScore = (0.50 * semanticSim + 0.35 * skillScore + 0.15 * expScore) * 100;
                matchType = 'peer';
              } else {
                compatibilityScore = (0.50 * semanticSim + 0.30 * skillScore + 0.20 * expScore) * 100;
                matchType = 'mentorship';
              }

              compatibilityScore = Math.max(15, Math.min(99, Math.round(compatibilityScore)));

              // Formulate dynamic chips/insights
              const insights = [];
              if (isPeer) {
                insights.push('Peer Match');
                const expDiff = Math.abs((currentUser.yearsOfExperience || 0) - (userJson.yearsOfExperience || 0));
                if (expDiff <= 1) insights.push('Similar Career Level');
              } else {
                insights.push(userJson.role === 'mentor' ? 'Expert Guide' : 'Aspiring Learner');
                const expGap = (userJson.yearsOfExperience || 0) - (currentUser.yearsOfExperience || 0);
                if (expGap >= 3 && expGap <= 6) insights.push('Ideal Experience Match');
              }

              const cleanSkills = (skills) => {
                if (!skills) return [];
                try {
                  const parsed = typeof skills === 'string' ? JSON.parse(skills) : skills;
                  if (Array.isArray(parsed)) return parsed;
                  return Object.values(parsed);
                } catch {
                  return String(skills).split(',');
                }
              };

              const userSkills = cleanSkills(currentUser.skills).map(s => s.trim().toLowerCase());
              const candidateSkills = cleanSkills(userJson.skills).map(s => s.trim().toLowerCase());
              const overlap = userSkills.filter(s => candidateSkills.includes(s));

              if (overlap.length > 0) {
                insights.push(`${overlap.length} Shared Skill${overlap.length > 1 ? 's' : ''}`);
              }

              userJson.matchDetails = {
                compatibilityScore,
                matchType,
                insights
              };
            }
            usersWithAI.push(userJson);
          }
        } catch (err) {
          console.error("Error computing AI metrics for explore feed:", err);
          usersWithAI = users;
        }
    } else {
      usersWithAI = users;
    }

    const responseData = {
      users: usersWithAI,
      totalCount: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      hasMore: page * limit < count,
      message: 'Fetched data for profiles'
    };

    // Cache the result
    usersCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};



exports.fetchSingleUser = async (req, res, next) => {
  try {

    const user = await User.findOne({
      where: { username: req.params.username },
      attributes: { exclude: ['password'] },  // Exclude sensitive data like password
      include: [
        {
          model: MentorshipRequest,
          as: 'sentRequests', // Include sent requests
          where: { status: { [Op.ne]: 'declined' } }, // Exclude declined requests
          required: false, // Optional: Users without sent requests will also be returned
        },
        {
          model: MentorshipRequest,
          as: 'receivedRequests', // Include received requests
          where: { status: { [Op.ne]: 'declined' } }, // Exclude declined requests
          required: false, // Optional: Users without received requests will also be returned
        },
      ],
    });


    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user, message: 'Fetched data successfully' });
  } catch (error) {
    next(error);
  }
};


exports.fetchSingleUserById = async (req, res, next) => {
  try {

    const user = await User.findOne({
      where: { id: req.params.id },
      attributes: { exclude: ['password'] },  // Exclude sensitive data like password

    });


    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user, message: 'Fetched data successfully' });
  } catch (error) {
    next(error);
  }
};


// Cosine Similarity Helper
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0.5;
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0.5;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Experience Score Helper
function calculateExperienceScore(currentUserExp, candidateExp, isPeer) {
  if (isPeer) {
    const gap = Math.abs(currentUserExp - candidateExp);
    if (gap <= 1) return 1.0; // Perfect parallel pace
    if (gap === 2) return 0.8;
    if (gap === 3) return 0.6;
    return 0.3; // High disparity, less suitable for co-learning
  } else {
    // Mentorship mode: candidate is opposite role
    const gap = candidateExp - currentUserExp; // Positive means candidate is more experienced
    if (gap <= 0) return 0.2; // Candidate has less or equal experience
    if (gap >= 3 && gap <= 6) return 1.0; // Perfect sweet-spot
    if (gap < 3) return 0.7; // Moderate progression
    return 0.85; // Highly experienced, good but potentially distant
  }
}

// Skill Overlap Score Helper
function calculateSkillScore(userSkills, candidateSkills, isPeer) {
  const cleanSkills = (skills) => {
    if (!skills) return [];
    try {
      const parsed = typeof skills === 'string' ? JSON.parse(skills) : skills;
      if (Array.isArray(parsed)) return parsed.map(s => s.trim().toLowerCase());
      if (typeof parsed === 'object') return Object.values(parsed).map(s => String(s).trim().toLowerCase());
      return String(parsed).split(',').map(s => s.trim().toLowerCase());
    } catch {
      return String(skills).split(',').map(s => s.trim().toLowerCase());
    }
  };

  const a = cleanSkills(userSkills);
  const b = cleanSkills(candidateSkills);
  if (a.length === 0 || b.length === 0) return 0.1;

  const intersection = a.filter(x => b.includes(x));

  if (isPeer) {
    // Same role: high overlap is good (shared study interest)
    const union = [...new Set([...a, ...b])];
    return intersection.length / union.length; // Jaccard similarity
  } else {
    // Different role: we want the mentor to have skills that the mentee does not have, or overlap
    return intersection.length / Math.max(1, a.length);
  }
}

// Dynamic Hybrid Matching Engine Controller (Optimized)
exports.fetchMatches = async (req, res, next) => {
  try {
    const currentUserId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const sequelize = User.sequelize;

    // 1. Check in-memory cache first
    const cacheKey = `matches_${currentUserId}_p${page}_l${limit}`;
    const cached = matchesCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return res.status(200).json(cached.data);
    }

    // 2. Fetch current user profile
    const currentUser = await User.findByPk(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' });
    }

    // 3. Parse current user embedding (must already exist — generated on profile setup/update)
    let currentUserEmbedding;
    if (!currentUser.profileEmbedding) {
      return res.status(200).json({
        matches: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasMore: false,
        message: 'Profile embedding not yet generated. Please complete your profile setup.'
      });
    } else {
      currentUserEmbedding = JSON.parse(currentUser.profileEmbedding);
    }

    // 4. Fetch list of connections to exclude (accepted or pending)
    const activeConnectionIds = await MentorshipRequest.findAll({
      where: {
        [Op.or]: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ],
        status: { [Op.in]: ['accepted', 'pending'] }
      },
      attributes: ['senderId', 'receiverId']
    }).then(requests => {
      const ids = new Set();
      requests.forEach(r => {
        if (r.senderId !== currentUserId) ids.add(r.senderId);
        if (r.receiverId !== currentUserId) ids.add(r.receiverId);
      });
      return Array.from(ids);
    });

    // 5. Fetch top 100 closest users who ALREADY have embeddings (no lazy generation)
    const whereClause = {
      id: { [Op.ne]: currentUserId },
      role: { [Op.ne]: null },
      bio: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
      profileEmbedding: { [Op.ne]: null } // Only users with pre-computed embeddings
    };

    if (activeConnectionIds.length > 0) {
      whereClause.id = {
        [Op.and]: [
          { [Op.ne]: currentUserId },
          { [Op.notIn]: activeConnectionIds }
        ]
      };
    }

    const otherUsers = await User.findAll({
      where: whereClause,
      attributes: {
        exclude: ['password'],
        include: [
          [
            sequelize.literal(`1 - ("profileEmbedding" <=> '[${currentUserEmbedding.join(',')}]'::vector)`),
            'semanticSim'
          ]
        ]
      },
      order: sequelize.literal(`"profileEmbedding" <=> '[${currentUserEmbedding.join(',')}]'::vector ASC`),
      limit: 100 // Only fetch top 100 closest semantic matches from DB
    });

    // 6. Compute Hybrid Compatibility Scores (in-memory, no external calls)
    const matchedUsers = [];

    const cleanSkills = (skills) => {
      if (!skills) return [];
      try {
        const parsed = typeof skills === 'string' ? JSON.parse(skills) : skills;
        if (Array.isArray(parsed)) return parsed;
        return Object.values(parsed);
      } catch {
        return String(skills).split(',');
      }
    };

    const userSkills = cleanSkills(currentUser.skills).map(s => s.trim().toLowerCase());

    for (const candidate of otherUsers) {
      const isPeer = currentUser.role === candidate.role;
      const dbSemanticSim = candidate.getDataValue('semanticSim');
      const semanticSim = dbSemanticSim !== null && !isNaN(dbSemanticSim)
        ? parseFloat(dbSemanticSim)
        : 0.50; // Fallback

      const expScore = calculateExperienceScore(
        currentUser.yearsOfExperience || 0,
        candidate.yearsOfExperience || 0,
        isPeer
      );

      const skillScore = calculateSkillScore(
        currentUser.skills,
        candidate.skills,
        isPeer
      );

      // Fusion Scoring Formula
      let compatibilityScore = 0;
      let matchType = '';

      if (isPeer) {
        // Peer Mode (Horizontal)
        compatibilityScore = (0.50 * semanticSim + 0.35 * skillScore + 0.15 * expScore) * 100;
        matchType = 'peer';
      } else {
        // Mentorship Mode (Vertical)
        compatibilityScore = (0.50 * semanticSim + 0.30 * skillScore + 0.20 * expScore) * 100;
        matchType = 'mentorship';
      }

      // Bound compatibilityScore between 15% and 99% for visual consistency
      compatibilityScore = Math.max(15, Math.min(99, Math.round(compatibilityScore)));

      // Generate key descriptive visual badges/insights
      const insights = [];
      if (isPeer) {
        insights.push('Peer Match');
        const expDiff = Math.abs((currentUser.yearsOfExperience || 0) - (candidate.yearsOfExperience || 0));
        if (expDiff <= 1) insights.push('Similar Career Level');
      } else {
        insights.push(candidate.role === 'mentor' ? 'Expert Guide' : 'Aspiring Learner');
        const expGap = (candidate.yearsOfExperience || 0) - (currentUser.yearsOfExperience || 0);
        if (expGap >= 3 && expGap <= 6) insights.push('Ideal Experience Match');
      }

      const candidateSkills = cleanSkills(candidate.skills).map(s => s.trim().toLowerCase());
      const overlap = userSkills.filter(s => candidateSkills.includes(s));

      if (overlap.length > 0) {
        insights.push(`${overlap.length} Shared Skill${overlap.length > 1 ? 's' : ''}`);
      }

      // Append matched profile payload
      matchedUsers.push({
        user: {
          id: candidate.id,
          username: candidate.username,
          fullName: candidate.fullName,
          email: candidate.email,
          role: candidate.role,
          bio: candidate.bio,
          skills: candidate.skills,
          experience: candidate.experience,
          education: candidate.education,
          socialLinks: candidate.socialLinks,
          yearsOfExperience: candidate.yearsOfExperience
        },
        compatibilityScore,
        matchType,
        insights
      });
    }

    // 7. Sort by highest compatibility score descending
    matchedUsers.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // Limit to top 20 matches total as requested: "show 20 results and on two pages"
    const topMatches = matchedUsers.slice(0, 20);
    const paginatedMatches = topMatches.slice(offset, offset + limit);

    const responseData = {
      matches: paginatedMatches,
      totalCount: topMatches.length,
      currentPage: page,
      totalPages: Math.ceil(topMatches.length / limit),
      hasMore: offset + limit < topMatches.length,
      message: 'Successfully computed AI matches'
    };

    // 8. Cache the result
    matchesCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    res.status(200).json(responseData);

  } catch (error) {
    next(error);
  }
};


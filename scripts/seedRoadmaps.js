const sequelize = require('../config/db');
const User = require('../models/User');
const Course = require('../models/Course');
const Module = require('../models/Module');
const CourseEnrollment = require('../models/CourseEnrollment');

const roadmapsData = [
  {
    title: "Frontend Development with React & TypeScript",
    description: "Learn to build high-performance, accessible, and scalable user interfaces using React, TypeScript, and modern state management. Ideal for aspiring UI developers.",
    skillsTargeted: ["React", "TypeScript", "Tailwind CSS", "Redux Toolkit", "Web Performance"],
    durationValue: 8,
    durationUnit: "Weeks",
    maxStudents: 15,
    modules: [
      {
        title: "Introduction to TypeScript in React",
        summary: "Configure the compiler, configure tsconfig, type react component props, and manage typed useState and useEffect hooks.",
        resources: [
          { title: "Official TypeScript Handbook", url: "https://www.typescriptlang.org/docs/" },
          { title: "React TypeScript Cheatsheet", url: "https://react-typescript-cheatsheet.netlify.app/" }
        ]
      },
      {
        title: "Component Architecture & Composition",
        summary: "Learn structural patterns like Compound Components, Control Props, Render Props, and custom hooks to build reusable UI kits.",
        resources: [
          { title: "Advanced React Component Patterns", url: "https://kentcdodds.com/blog/compound-components-with-react-hooks" }
        ]
      },
      {
        title: "State Management with Redux Toolkit",
        summary: "Architect global state, configure store, slice reducers, implement middleware, and manage async caching queries using RTK Query.",
        resources: [
          { title: "Redux Toolkit Documentation", url: "https://redux-toolkit.js.org/" }
        ]
      },
      {
        title: "Web Performance & Virtualization",
        summary: "Audit bundle sizes, virtualize long lists, debounce search queries, use React.memo, and analyze rendering lifecycles.",
        resources: [
          { title: "React Virtualization Guide", url: "https://web.dev/virtualize-long-lists-react-window/" }
        ]
      }
    ]
  },
  {
    title: "Modern Backend Systems with Node.js & SQL",
    description: "Deep dive into designing scalable backend services. Master database pooling, Redis caching strategies, transaction isolation levels, and secure API architectures.",
    skillsTargeted: ["Node.js", "Express", "PostgreSQL", "Redis", "Sequelize", "API Design"],
    durationValue: 6,
    durationUnit: "Weeks",
    maxStudents: 20,
    modules: [
      {
        title: "Database Modeling and migrations with ORM",
        summary: "Configure Sequelize models, write SQL schemas, configure indexes, set up database pooling, and manage data relations.",
        resources: [
          { title: "Sequelize Associations Guide", url: "https://sequelize.org/docs/v6/core-concepts/assocs/" }
        ]
      },
      {
        title: "Query Optimization & Caching",
        summary: "Analyze EXPLAIN statements, write composite indexes, configure database clusters, and implement caching using Redis.",
        resources: [
          { title: "Redis Cache Aside Pattern", url: "https://redis.io/docs/manual/client-side-caching/" }
        ]
      },
      {
        title: "API Authentication & Security Auditing",
        summary: "Implement JSON Web Tokens, configure HTTP-only cookies, manage CORS policies, hash passwords, and prevent rate limits.",
        resources: [
          { title: "OWASP Node.js Security Checklist", url: "https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html" }
        ]
      }
    ]
  },
  {
    title: "Data Science & Machine Learning Foundations",
    description: "An introductory course to data analysis, cleaning, visualization, and building predictive machine learning models. Master Scikit-Learn pipelines.",
    skillsTargeted: ["Python", "Pandas", "Scikit-Learn", "Data Visualization", "ML Algorithms"],
    durationValue: 12,
    durationUnit: "Weeks",
    maxStudents: 30,
    modules: [
      {
        title: "Python for Data Analysis",
        summary: "Set up Jupyter notebook, manipulate multi-dimensional arrays with NumPy, and clean datasets using Pandas DataFrames.",
        resources: [
          { title: "Python Data Science Handbook", url: "https://jakevdp.github.io/PythonDataScienceHandbook/" }
        ]
      },
      {
        title: "Exploratory Data Analysis & Cleaning",
        summary: "Plot graphs using Seaborn, clean outliers, impute missing values, configure data scaling, and perform feature engineering.",
        resources: [
          { title: "Pandas Data Cleaning Guide", url: "https://pandas.pydata.org/docs/user_guide/missing_data.html" }
        ]
      },
      {
        title: "Supervised Learning Models",
        summary: "Build Linear regression, Logistic regression, Decision trees, and Random forests classifiers using Scikit-Learn.",
        resources: [
          { title: "Scikit-Learn Supervised Models", url: "https://scikit-learn.org/stable/supervised_learning.html" }
        ]
      }
    ]
  },
  {
    title: "UI/UX Product Design & Figma Systems",
    description: "Learn to conduct user research, create wireframes, master Figma components, establish design systems, and build high-fidelity interactive prototypes.",
    skillsTargeted: ["Figma", "UI/UX", "Wireframing", "User Research", "Design Systems"],
    durationValue: 1,
    durationUnit: "Months",
    maxStudents: 12,
    modules: [
      {
        title: "UX Research and Low-Fidelity Layouts",
        summary: "Build user personas, analyze competitors, construct site architectures, sketch layouts, and test wireframes.",
        resources: [
          { title: "Nielsen Norman UX Research Basics", url: "https://www.nngroup.com/articles/ux-research-cheat-sheet/" }
        ]
      },
      {
        title: "Figma Components & Auto-Layout",
        summary: "Build buttons, inputs, headers using Figma Auto-Layout, configure component properties, and set responsive constraints.",
        resources: [
          { title: "Figma Auto-Layout Tutorials", url: "https://help.figma.com/hc/en-us/articles/360040451374-Create-dynamic-layouts-with-Auto-layout" }
        ]
      },
      {
        title: "Design Systems & Tokens",
        summary: "Define spacing, typography styles, shadows, borders, color palettes, and manage Figma global variables.",
        resources: [
          { title: "Material Design 3 Guidelines", url: "https://m3.material.io/" }
        ]
      }
    ]
  },
  {
    title: "DevOps & Continuous Integration with AWS",
    description: "Deploy scalable, resilient systems to the cloud. Learn containerization, build CI/CD pipelines, configure Terraform, and set up cloud monitoring.",
    skillsTargeted: ["AWS", "Docker", "Kubernetes", "CI/CD", "DevOps"],
    durationValue: 10,
    durationUnit: "Weeks",
    maxStudents: 25,
    modules: [
      {
        title: "Dockerizing Applications & Composers",
        summary: "Write Dockerfiles, build multi-stage builds, setup docker-compose configurations, and manage local volumes.",
        resources: [
          { title: "Docker Best Practices Handbook", url: "https://docs.docker.com/develop/develop-images/dockerfile_best-practices/" }
        ]
      },
      {
        title: "AWS Networking & Cluster Services",
        summary: "Configure VPC settings, set up subnets, open ports via security groups, configure EC2 instances, and mount S3 storage.",
        resources: [
          { title: "AWS VPC Architecture Guide", url: "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html" }
        ]
      },
      {
        title: "GitHub Actions CI/CD Pipeline",
        summary: "Configure environment secrets, write build workflow scripts, run automated tests, and trigger auto-deployment.",
        resources: [
          { title: "GitHub Actions Workflow Syntax", url: "https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions" }
        ]
      }
    ]
  },
  {
    title: "Product Management & Agile Roadmapping",
    description: "Master the art of shipping successful products. Define product vision, prioritize backlogs using RICE, run sprints, and lead cross-functional squads.",
    skillsTargeted: ["Product Management", "Agile", "Scrum", "Product Roadmap", "RICE Prioritization"],
    durationValue: 6,
    durationUnit: "Weeks",
    maxStudents: 18,
    modules: [
      {
        title: "Product Strategy & Requirements PRD",
        summary: "Perform market research, draft detailed product requirements documents, define success metrics, and set milestones.",
        resources: [
          { title: "How to Write a Great PRD", url: "https://www.productplan.com/glossary/product-requirements-document/" }
        ]
      },
      {
        title: "Prioritization & Sprint Execution",
        summary: "Use RICE models, manage Scrum backlogs, estimate user stories, run daily standups, and analyze burn-down charts.",
        resources: [
          { title: "RICE Prioritization Framework", url: "https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/" }
        ]
      }
    ]
  },
  {
    title: "Mobile App Development with React Native",
    description: "Build high-quality cross-platform native iOS and Android apps using React Native, Expo, and native device features.",
    skillsTargeted: ["React Native", "TypeScript", "Expo", "Mobile UI", "App Store Deploy"],
    durationValue: 8,
    durationUnit: "Weeks",
    maxStudents: 15,
    modules: [
      {
        title: "Expo CLI Layouts & Navigation",
        summary: "Configure SDK versions, lay out UI with Flexbox, configure Expo router tabs, and manage safe area contexts.",
        resources: [
          { title: "Expo Router Documentation", url: "https://docs.expo.dev/router/introduction/" }
        ]
      },
      {
        title: "Native APIs & Hardware Hooks",
        summary: "Fetch geolocation data, access hardware cameras, manage image picker hooks, and send local push notifications.",
        resources: [
          { title: "React Native Geolocation Guide", url: "https://docs.expo.dev/versions/latest/sdk/location/" }
        ]
      }
    ]
  },
  {
    title: "Cybersecurity Fundamentals & Cryptography",
    description: "Understand the fundamentals of cryptography, web threats, penetration testing, and security auditing to protect applications.",
    skillsTargeted: ["Cybersecurity", "Penetration Testing", "Security Auditing", "Cryptography", "Network Security"],
    durationValue: 5,
    durationUnit: "Weeks",
    maxStudents: 20,
    modules: [
      {
        title: "OWASP Web Security",
        summary: "Audit apps against SQL injections, prevent XSS scripts, manage CSRF tokens, and secure headers.",
        resources: [
          { title: "OWASP Top Ten Security Guide", url: "https://owasp.org/www-project-top-ten/" }
        ]
      },
      {
        title: "Symmetric and Asymmetric Cryptography",
        summary: "Analyze AES hashing, set up SSH key pairs, understand RSA key exchanges, and sign secure documents.",
        resources: [
          { title: "SSL/TLS Cryptographic Protocol Overview", url: "https://www.cloudflare.com/learning/ssl/what-is-ssl/" }
        ]
      }
    ]
  }
];

const seedRoadmaps = async () => {
  const transaction = await sequelize.transaction();
  try {
    console.log("Fetching seeded users from database...");
    const mentors = await User.findAll({ where: { role: 'mentor' } });
    const mentees = await User.findAll({ where: { role: 'mentee' } });

    if (mentors.length === 0 || mentees.length === 0) {
      console.error("Please run the base database seed command first: node scripts/seed.js");
      process.exit(1);
    }

    console.log(`Found ${mentors.length} Mentors and ${mentees.length} Mentees. Cleaning old roadmaps data...`);
    await Course.destroy({ where: {}, truncate: { cascade: true }, force: true, transaction });
    await CourseEnrollment.destroy({ where: {}, truncate: { cascade: true }, force: true, transaction });

    console.log("Seeding 8 unique roadmaps with syllabus modules and mock enrollments...");

    for (let i = 0; i < roadmapsData.length; i++) {
      const data = roadmapsData[i];
      // Distribute roadmaps among mentors
      const creator = mentors[i % mentors.length];

      // Create Roadmap (Course)
      const course = await Course.create({
        title: data.title,
        description: data.description,
        skillsTargeted: data.skillsTargeted,
        durationValue: data.durationValue,
        durationUnit: data.durationUnit,
        maxStudents: data.maxStudents,
        creatorId: creator.id
      }, { transaction });

      // Create Syllabus Modules
      for (let m = 0; m < data.modules.length; m++) {
        const mod = data.modules[m];
        await Module.create({
          courseId: course.id,
          orderIndex: m + 1,
          title: mod.title,
          summary: mod.summary,
          resources: mod.resources || [],
          meetingLink: `https://meet.google.com/abc-defg-hij`,
          meetingTime: new Date(Date.now() + (m + 1) * 24 * 60 * 60 * 1000) // consecutive days
        }, { transaction });
      }

      // Auto-enroll creator as accepted
      await CourseEnrollment.create({
        courseId: course.id,
        userId: creator.id,
        status: 'accepted',
        completedModules: []
      }, { transaction });

      // Pick 3 random mentees to enroll in this course
      const shuffledMentees = [...mentees].sort(() => 0.5 - Math.random());
      const selectedMentees = shuffledMentees.slice(0, 3);

      for (let j = 0; j < selectedMentees.length; j++) {
        const mentee = selectedMentees[j];
        // 70% chance accepted, 30% pending
        const isAccepted = Math.random() > 0.3;
        const status = isAccepted ? 'accepted' : 'pending';
        // If accepted, randomly mark first lesson complete
        const completedModules = isAccepted && Math.random() > 0.4 ? [1] : [];

        await CourseEnrollment.create({
          courseId: course.id,
          userId: mentee.id,
          status: status,
          completedModules: completedModules
        }, { transaction });
      }
    }

    await transaction.commit();
    console.log("Successfully seeded 8 professional roadmaps with realistic data and mentee enrollments!");
    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error("Error seeding roadmaps:", error);
    process.exit(1);
  }
};

seedRoadmaps();

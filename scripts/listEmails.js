const sequelize = require('../config/db');
const User = require('../models/User');

const fs = require('fs');
const path = require('path');

const fetchEmails = async () => {
    try {
        await sequelize.authenticate();
        const users = await User.findAll({ attributes: ['email', 'fullName', 'role'] });
        
        const header = "--- SEEDED USER EMAILS ---\n\n";
        const content = users.map((u, i) => `${i + 1}. [${u.role.toUpperCase()}] ${u.fullName.padEnd(20)} : ${u.email}`).join('\n');
        const footer = "\n\nPassword for all: SkillSync@2026\n";
        
        const fullOutput = header + content + footer;
        
        // Write to the root project directory (parent folder)
        fs.writeFileSync(path.join(__dirname, '../seeded_users.txt'), fullOutput);
        console.log("Emails written to seeded_users.txt at the root folder.");
        console.log(fullOutput);
        process.exit(0);
    } catch (error) {
        console.error("Error fetching emails:", error);
        process.exit(1);
    }
};

fetchEmails();

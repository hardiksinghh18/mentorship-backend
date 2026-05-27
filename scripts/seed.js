const sequelize = require('../config/db');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const firstNamesMale = ["Aarav", "Ishaan", "Arjun", "Karan", "Rohan", "Vivek", "Rahul", "Sahil", "Aditya", "Vihaan", "Reyansh", "Aryan", "Shaurya", "Tushar", "Yash", "Parth", "Dev", "Kabir", "Arav", "Rishi"];
const firstNamesFemale = ["Priya", "Ananya", "Sanya", "Meera", "Ishani", "Diya", "Myra", "Navya", "Ahana", "Saisha", "Pari", "Prisha", "Riya", "Kavya", "Advika", "Sara", "Zara", "Aavya", "Vanya", "Ira"];
const lastNames = ["Sharma", "Patel", "Gupta", "Singh", "Mehta", "Iyer", "Malhotra", "Reddy", "Verma", "Joshi", "Das", "Rao", "Nair", "Kulkarni", "Choudhury"];

const skillsPool = ["React", "Node.js", "Python", "Java", "Figma", "Product Management", "Data Science", "AWS", "Docker", "Kubernetes", "SQL", "UI/UX", "Marketing", "SEO", "Agile", "Spring Boot", "Machine Learning", "Cloud Arch", "DevOps", "Cybersecurity"];

const biosPool = [
    "Passionate software engineer with a focus on high-performance systems.",
    "Design enthusiast with a keen eye for user behavior and aesthetics.",
    "Data scientist exploring the intersections of AI and human psychology.",
    "Marketing lead helping startups scale from zero to one.",
    "Building modern web applications with a focus on simplicity.",
    "Experienced mentor looking to give back to the tech community.",
    "Student/Learner eager to master backend development and cloud scaling.",
    "Product manager bridging the gap between business goals and tech."
];

const generateUsers = (count) => {
    const users = [];
    const emailProviders = ["gmail.com", "outlook.com", "yahoo.com", "icloud.com", "hotmail.com"];
    
    for (let i = 0; i < count; i++) {
        const isMale = Math.random() > 0.5;
        const firstName = isMale ? firstNamesMale[Math.floor(Math.random() * firstNamesMale.length)] : firstNamesFemale[Math.floor(Math.random() * firstNamesFemale.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;
        const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}${Math.floor(Math.random() * 999)}`;
        const email = `${username}@${emailProviders[Math.floor(Math.random() * emailProviders.length)]}`;
        
        // Randomly assign Mentor or Mentee
        const role = Math.random() > 0.5 ? "mentor" : "mentee";
        
        // Pick 3 random skills
        const skills = [];
        for(let s=0; s<3; s++) skills.push(skillsPool[Math.floor(Math.random() * skillsPool.length)]);
        
        const bio = biosPool[Math.floor(Math.random() * biosPool.length)];

        users.push({ fullName, username, email, role, skills, bio });
    }
    return users;
};

const seedDatabase = async () => {
    try {
        console.log("Connecting to database...");
        await sequelize.authenticate();
        
        console.log("Clearing existing data...");
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await sequelize.sync({ force: true });
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log("Generating 50 random Indian users...");
        const usersData = generateUsers(50);
        
        // Strong password: Capital, Char, Special Char, Number
        const hashedPassword = await bcrypt.hash("SkillSync@2026", 10);
        
        for (const user of usersData) {
            await User.create({
                ...user,
                password: hashedPassword
            });
        }
        
        console.log("Successfully seeded database with 50 unique users!");
        console.log("Password for all users: SkillSync@2026");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
};

seedDatabase();

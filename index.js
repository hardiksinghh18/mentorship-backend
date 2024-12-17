const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db');
const sequelize = require('./sequelize');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const verifyTokens = require('./middleware/verifyuser');
const logout = require('./middleware/logout');
const cookieParser = require('cookie-parser');
const app = express();


dotenv.config();

app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',  // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,  // Allow cookies to be sent and received
}));

// Routes
app.get('/',(req,res)=>{
  res.send('Welcome to Mentorship API');
})

app.get('/auth/verify-tokens', verifyTokens);
app.post('/auth/logout', logout);

app.use('/api/auth', authRoutes); 
app.use('/api/profile', profileRoutes);
app.use('/api/mentorship', mentorshipRoutes);


app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const mentorshipRoutes = require('./routes/mentorshipRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { fetchSingleUser, fetchAllUsers, fetchSingleUserById } = require('./controllers/dataController');
const verifyTokens = require('./middleware/verifyuser');
const logout = require('./middleware/logout');

dotenv.config();
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_BASE_URL || 'https://mentorship-matching-mu.vercel.app', // Ensure this is correct
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Allow cookies to be sent and received
}));

// SOCKET.IO IMPLEMENTATION
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_BASE_URL, // Ensure this is correct
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'], // Allow WebSocket transport
});

const users = {}; // Store userId -> socketId mapping

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Register user with their socket ID
  socket.on('registerUser', (userId) => {
    users[userId] = socket.id; // Map userId to socketId
    console.log(`User ${userId} registered with socket ID: ${socket.id}`);
  });

  // Handle private messaging
  socket.on('sendMessage', ({ senderId, receiverId, message }) => {
    console.log(`Message from ${senderId} to ${receiverId}: ${message}`);

    const receiverSocketId = users[receiverId];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveMessage', { senderId, message }); // Send to receiver
      io.to(socket.id).emit('receiveMessage', { senderId, message }); // Send back to sender for UI update
    } else {
      console.log(`User ${receiverId} is not online`);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    const userId = Object.keys(users).find((key) => users[key] === socket.id);
    if (userId) {
      delete users[userId];
      console.log(`User ${userId} disconnected`);
    }
  });

  // Handle connection errors
  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
  });
});

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to Mentorship API');
});

app.get('/auth/verify-tokens', verifyTokens);
app.post('/auth/logout', logout);

// Backend: Get all user profiles
app.get('/users', fetchAllUsers);
app.get('/users/:username', fetchSingleUser);
app.get('/user/:id', fetchSingleUserById);

// Register your route handlers
app.use('/api/auth', authRoutes);
app.use('/api/profile/update', profileRoutes);
app.use('/api/connections', mentorshipRoutes);
app.use('/api/chat', chatRoutes);

// Server listener
server.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});



// const express = require('express');
// const http = require('http');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const cookieParser = require('cookie-parser');
// const { Server } = require('socket.io');
// const authRoutes = require('./routes/authRoutes');
// const profileRoutes = require('./routes/profileRoutes');
// const mentorshipRoutes = require('./routes/mentorshipRoutes');
// const chatRoutes = require('./routes/chatRoutes');
// const { fetchSingleUser, fetchAllUsers, fetchSingleUserById } = require('./controllers/dataController');
// const verifyTokens = require('./middleware/verifyuser');
// const logout = require('./middleware/logout');

// dotenv.config();
// const app = express();
// const server = http.createServer(app);

// // Middleware
// app.use(cookieParser());
// app.use(express.json());
// app.use(cors({
//   origin: process.env.FRONTEND_BASE_URL ||  'https://mentorship-matching-mu.vercel.app',  // Make sure FRONTEND_BASE_URL is set in your .env
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true,  // Allow cookies to be sent and received
// }));

// // SOCKET.IO IMPLEMENTATION
// const io = new Server(server, {
//   cors: {
    
//     origin: process.env.FRONTEND_BASE_URL,  // Make sure this is correct
//     methods: ['GET', 'POST'],
//     credentials: true,  // Allow credentials (cookies)
//   },
//   transports: ['websocket'], // Allow both WebSocket and Polling
// });

// io.on('connection', (socket) => {
//   try {
  
//     console.log('A user connected:', socket.id);
 
//   // Handle incoming messages
//   socket.on('sendMessage', (data) => {
//     console.log('Received message:', data);
//     io.emit('receiveMessage', data); // Broadcast message to all connected clients
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });

//   // Optional: Handle connection errors
//   socket.on('connect_error', (err) => {
//     console.error('Socket connection error:', err);
//   });
//   } catch (error) {
//     console.log("Websocket connection failed due to backend issue",error)
//   }
// });

// // Routes
// app.get('/', (req, res) => {
//   res.send('Welcome to Mentorship API');
// });

// app.get('/auth/verify-tokens', verifyTokens);
// app.post('/auth/logout', logout);

// // Backend: Get all user profiles 
// app.get('/users', fetchAllUsers);
// app.get('/users/:username', fetchSingleUser);
// app.get('/user/:id', fetchSingleUserById);

// // Register your route handlers
// app.use('/api/auth', authRoutes);
// app.use('/api/profile/update', profileRoutes);
// app.use('/api/connections', mentorshipRoutes);
// app.use('/api/chat', chatRoutes);

// // Server listener
// server.listen(process.env.PORT || 5000, () => {
//   console.log(`Server running on port ${process.env.PORT || 5000}`);
// });

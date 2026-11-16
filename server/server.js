const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Body parser
app.use(express.json());

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach io to app context so controllers can use req.app.get('io')
app.set('io', io);

// Socket.io connection listener
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Connect to Database
connectDB();

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/buses', require('./routes/busRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/demand', require('./routes/demandRoutes'));

// Health check endpoint for Cron-job.org / monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'CampusRide Fleet API',
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date()
  });
});

// Lightweight ping endpoint for keep-alive crons
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Serve frontend in production (Render single-service deployment)
const clientDistPath = path.join(__dirname, '../client/dist');
if (process.env.NODE_ENV === 'production' || fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io')) {
      return res.status(404).json({ success: false, message: 'API route not found' });
    }
    res.sendFile(path.resolve(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('CampusRide Transit Management API is running in development mode...');
  });
}

// Built-in Keep-Alive Ping (Runs every 14 minutes to prevent Render free-tier sleep)
const initKeepAliveCron = () => {
  const targetUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL;
  if (!targetUrl) return;

  const PING_INTERVAL = 14 * 60 * 1000; // 14 mins (Render sleeps at 15 mins)
  console.log(`[Cron Keep-Alive] Initialized self-ping for ${targetUrl} every 14 minutes`);

  setInterval(async () => {
    try {
      const pingEndpoint = `${targetUrl.replace(/\/$/, '')}/ping`;
      const res = await fetch(pingEndpoint);
      console.log(`[Cron Keep-Alive] Pinged ${pingEndpoint} - Status: ${res.status}`);
    } catch (err) {
      console.warn(`[Cron Keep-Alive] Ping error: ${err.message}`);
    }
  }, PING_INTERVAL);
};

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  initKeepAliveCron();
});

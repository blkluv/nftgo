require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const User = require('./api/users'); // Модель
const connectDB = require('./db/db'); // Подключение к MongoDB

const allowedOrigins = [
  'https://dima0073231.github.io',
  'https://dima0073231.github.io/nftgo',
  'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Разрешить запросы без origin (например, из Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowedOrigin => 
      origin.startsWith(allowedOrigin) || 
      origin.includes(allowedOrigin.replace(/https?:\/\//, ''))
    )) {
      callback(null, true);
    } else {
      console.error(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const app = express();

// Важно: сначала CORS, затем другие middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Предварительные запросы
app.use(express.json());


// Подключение к БД
connectDB();

// Роуты
app.post('/api/users', async (req, res) => {
    try {
        const user = new User(req.body); 
        await user.save();
        res.status(201).json(user);
        console.log('✅ Пользователь успешно создан:', user.username);
    } catch (err) {
        console.error('❌ Ошибка при создании пользователя:', err.message);
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
        console.log(`✅ Отправлен список из ${users.length} пользователей.`);
    } catch (err) {
        console.error('❌ Ошибка при получении пользователей:', err.message);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// WebSocket сервер
const WebSocket = require('ws');
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Server started on http://localhost:${process.env.PORT || 3000}`);
});

const wss = new WebSocket.Server({ server });

let clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Подключился клиент. Сейчас онлайн:', clients.size);
  broadcastOnline();

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Клиент отключился. Сейчас онлайн:', clients.size);
    broadcastOnline();
  });
});

function broadcastOnline() {
  const count = clients.size;
  const message = JSON.stringify({ online: count });

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}



// if (process.env.NODE_ENV === 'development') {
//   require('./test-auto'); 
// }

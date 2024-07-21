const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(bodyParser.json());

app.get('/messages', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM messages ORDER BY timestamp ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/messages', async (req, res) => {
    const { username, message } = req.body;
    console.log(`Received message from ${username}: ${message}`);
    try {
        const result = await pool.query(
            'INSERT INTO messages (username, message) VALUES ($1, $2) RETURNING *',
            [username, message]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('join-room', (username) => {
        socket.join(username);
        console.log(`${username} joined the room`);
    });

    socket.on('call-user', ({ userToCall, signal, from }) => {
        console.log(`Calling ${userToCall} from ${from}`);
        io.to(userToCall).emit('incoming-call', { from, signal });
    });

    socket.on('accept-call', ({ signal, to }) => {
        console.log(`Call accepted by ${to}`);
        io.to(to).emit('call-accepted', signal);
    });

    socket.on('call-error', ({ to, message }) => {
        console.log(`Call error: ${message}`);
        io.to(to).emit('call-error', message);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

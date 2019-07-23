const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);




const MAX_HISTORY_LEN = 5;

const rooms = {
    'child abuse': { users: new Set(), history: [] },
    'pruno': { users: new Set(), history: [] },
    'test': { users: new Set(), history: [] }
};

server.listen(3000, function () {
    console.log('listening on *:3000');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})

app.get('/js/sign-in.js', (req, res) => {
    res.sendFile(__dirname + '/js/sign-in.js');
})

app.get('/js/chat.js', (req, res) => {
    res.sendFile(__dirname + '/js/chat.js');
})

io.sockets.on('connection', socket => {

    //  Disconnect
    socket.on('disconnect', data => {
        if (socket.user) {
            const { username, room: currentRoomName } = socket.user;
            const room = rooms[currentRoomName];
            socket.leave(currentRoomName);
            room.users.delete(username);
            io.sockets.in(currentRoomName).emit('room_users', Array.from(room.users));
            io.sockets.in(currentRoomName).emit('message', { user: '__system', msg: `${username} has disconnected` });
        }
    });

    // Handle message
    socket.on('message', data => {
        const { username, room: roomName } = socket.user;
        const room = rooms[roomName];
        if (room.history.length === MAX_HISTORY_LEN) {
            room.history.pop();
        }
        const message = { user: username, msg: data };
        room.history.unshift(message);

        io.sockets.in(socket.user.room).emit('message', message);
    });

    // Join chat
    socket.on('join', (username,ack) => {
        socket.user = { username };
        ack(Object.keys(rooms));
    });

    // Switch room
    socket.on('switchRoom', (roomName, ack) => {
        const { username, room: currentRoomName } = socket.user;

        // leave current room
        if (currentRoomName) {
            const currentRoom = rooms[currentRoomName];
            socket.leave(currentRoomName);
            currentRoom.users.delete(username);
            io.sockets.in(currentRoomName).emit('room_users', Array.from(currentRoom.users));
            socket.broadcast.to(currentRoomName).emit('message', { user: '__system', msg: `${username} has left this room` });
        }

        const room = rooms[roomName];

        // join new room
        socket.broadcast.to(roomName).emit('message', { user: '__system', msg: `${username} has joined this room` });
        socket.join(roomName);
        socket.user.room = roomName;
        room.users.add(socket.user.username);

        // send new room users and history
        ack(room.history);
        io.sockets.in(roomName).emit('room_users', Array.from(room.users));
    });

});
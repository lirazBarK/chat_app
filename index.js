const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const users = [];
const connections = [];
const rooms = ['room1', 'room2', 'room3'];
const room1Users = [];
const room2Users = [];
const room3Users = [];



server.listen(3000, function () {
    console.log('listening on *:3000');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
})


io.sockets.on('connection', socket => {
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length);

    //  Disconnect
    socket.on('disconnect', data => {
        spliceUserName();
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1);
        socket.broadcast.emit('new message(2)', { msg: socket.username + ' has disconnected' });
        socket.leave(socket.room);
        console.log('Disconneted: %s sockets connected', connections.length);

    });

    // Send Message
    socket.on('send message', data => {
        io.sockets.in(socket.room).emit('new message(1)', { msg: data, user: socket.username });
    });

    //New User
    socket.on('new user', (data, callback) => {
        callback(true);
        socket.username = data;
        socket.room = 'room1';
        room1Users.push(socket.username);
        socket.join('room1');
        updateUsernames();
        socket.emit('new message(2)', { msg: 'you have connected to room1' });
        socket.broadcast.to('room1').emit('new message(2)', { msg: socket.username + ' has connected to this room' });
        socket.emit('updaterooms', rooms, 'room1');

    });

    function updateUsernames() {
        if (socket.room == 'room1') {
            io.sockets.emit('get users', room1Users);
        } else if (socket.room == 'room2') {
            io.sockets.emit('get users', room2Users);
        } else if (socket.room == 'room3') {
            io.sockets.emit('get users', room3Users);
        }
    }

    function spliceUserName() {
        if (socket.room == 'room1') {
            room1Users.splice(room1Users.indexOf(socket.username), 1);
        } else if (socket.room == 'room2') {
            room2Users.splice(room2Users.indexOf(socket.username), 1);
        } else if (socket.room == 'room3') {
            room3Users.splice(room3Users.indexOf(socket.username), 1);
        }
    }

    function pushUserName() {
        if (socket.room == 'room1') {
            room1Users.push(socket.username);
        } else if (socket.room == 'room2') {
            room2Users.push(socket.username);
        } else if (socket.room == 'room3') {
            room3Users.push(socket.username);
        }
    }
    

    socket.on('switchRoom', newroom => {
        // leave the current room (stored in session)
        spliceUserName();
        socket.leave(socket.room);
        // join new room, received as function parameter
        socket.join(newroom);
        socket.emit('new message(2)', { msg: 'you have connected to ' + newroom });
        // sent message to OLD room
        socket.broadcast.to(socket.room).emit('new message(2)', { msg: socket.username + ' has left this room' });
        // update socket session room title
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('new message(2)', { msg: socket.username + ' has joined this room' });
        socket.emit('updaterooms', rooms, newroom);
        pushUserName();
        updateUsernames();
    });


});
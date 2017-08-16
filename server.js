
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

connections = [];
users = [];
messages = [];
var num_messages_to_save = 50; //set to -1 for infinite

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
});

io.sockets.on('connection', function (socket) {
    connections.push(socket);
    console.log('%s users online', connections.length);

    // New user
    socket.on('new user', function (data, callback) {
        var exist = false;
        for (i = 0; i < users.length; i++) {
            if (data == users[i]) {
                exist = true;
            }
        };

        if (exist) {
            callback(false);
        } else {
            callback(true);
            socket.username = data;
            users.push(socket.username);
            updateUserList();
            userOnline();
            reloadOldMessages();
        }

    });

    // Send message
    socket.on('chat message', function (message) {
        if (messages.length == num_messages_to_save)
            messages.shift(); //delete oldest message
        messages.push({ msg: message, user: socket.username });
        io.emit('chat message', { msg: message, user: socket.username });
    });

    // Disconnect
    socket.on('disconnect', function () {
        if (socket.username) {
            userOffline();
            users.splice(users.indexOf(socket.username), 1);
            updateUserList();
        };
        connections.splice(connections.indexOf(socket), 1);
        console.log('%s users online', connections.length);
    });

    // Update the user list whenever a user connects or disconnects
    function updateUserList() {
        users.sort();
        io.emit('get users', users);
    };

    // Update the messages to get list of old messages
    function reloadOldMessages() {
        socket.emit('get messages', messages);
    };

    // Broadcast new user online message
    function userOnline() {
        socket.broadcast.emit('online message', { user: socket.username });
    }

    // Broadcast user offline message
    function userOffline() {
        socket.broadcast.emit('offline message', { user: socket.username });
    }
});

server.listen(process.env.PORT || 3000, function () {
    console.log('The server is listening on port 3000')
});
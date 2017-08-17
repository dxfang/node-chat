
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var connections = [];
var users = [];
var chatroom = {};
var num_messages_to_save = 50; //set to -1 for infinite

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
});

io.sockets.on('connection', function (socket) {
    connections.push(socket);
    console.log('%s users online', connections.length);

    // New user
    socket.on('new user', function (data, chatroomName, callback) {
        chatroomName = createChatroom(chatroomName);

        var exist = false;
        for (i = 0; i < users.length; i++) {
            if (data == users[i].username && chatroomName == users[i].chatroom) {
                exist = true;
                break;
            }
        };

        if (exist) {
            callback(false);
        } else {
            callback(true);
            socket.username = data;
            socket.chatroomName = chatroomName;
            users.push({ username: socket.username, chatroom: socket.chatroomName });
            chatroom[chatroomName].users.push({ username: socket.username, chatroom: socket.chatroomName });
            updateUserList(chatroomName);
            userOnline();
            reloadOldMessages(chatroomName);
        }

    });

    // Send message
    socket.on('chat message', function (message) {
        //if (messages.length == num_messages_to_save)
        //    messages.shift(); //delete oldest message
        //messages.push({ msg: message, user: socket.username });
        //io.emit('chat message', { msg: message, user: socket.username });

        if (chatroom[socket.chatroomName].messages.length == num_messages_to_save)
            chatroom[socket.chatroomName].messages.shift(); //delete oldest message
        chatroom[socket.chatroomName].messages.push({ msg: message, user: socket.username });
        io.emit('chat message', { msg: message, user: socket.username }, socket.chatroomName);
    });

    // Disconnect
    socket.on('disconnect', function () {
        if (socket.username) {
            userOffline();
            users.splice(users.indexOf(socket.username), 1);

            users.splice(indexOfUser(users, socket.username, socket.chatroomName), 1);
            chatroom[socket.chatroomName].users.splice(indexOfUser(chatroom[socket.chatroomName].users, socket.username, socket.chatroomName), 1);
            updateUserList(socket.chatroomName);
        };
        connections.splice(connections.indexOf(socket), 1);
        console.log('%s users online', connections.length);
    });

    function indexOfUser(myArray, usName, crName) {
        for (var i = 0, len = myArray.length; i < len; i++) {
            if (myArray[i]['username'] === usName && myArray[i]['chatroom'] === crName) return i;
        }
        return -1;
    }

    // Update the user list whenever a user connects or disconnects
    function updateUserList(crName) {
        //users.sort();
        //io.emit('get users', users);
        chatroom[crName].users.sort();
        io.emit('get users', chatroom[crName].users, crName);
    };

    // Update the messages to get list of old messages
    function reloadOldMessages(crName) {
        socket.emit('get messages', chatroom[crName].messages, crName);
    };

    // Broadcast new user online message
    function userOnline() {
        socket.broadcast.emit('online message', { user: socket.username }, socket.chatroomName);
    }

    // Broadcast user offline message
    function userOffline() {
        socket.broadcast.emit('offline message', { user: socket.username }, socket.chatroomName);
    }

    function createChatroom(name) {
        if (name == "")
            name = "__default";
        if (!(name in chatroom))
            chatroom[name] = {
                messages: [],
                users: []
            };
        return name;
    }
});

server.listen(process.env.PORT || 3000, function () {
    console.log('The server is listening on port 3000')
});
$(function() {
    var socket = io();

    // New user log in
    $('#login_form').submit(function() {
        var temp_name = $('#username').val();
        if (temp_name == '') {
            alert('Username can not be empty.');
        } else {
            socket.emit('new user', $('#username').val(), function(data) {
                if (data) {
                    $('#login_section').hide();
                    $('#chat_section').show();
                } else {
                    $('#username').val('');
                    alert('Username already exists.');
                }
            });
        }
        return false;
    });

    // Send new message
    $('#chat_form').submit(function() {
        socket.emit('chat message', $('#message').val() + '&nbsp');
        $('#message').val('');
        return false;
    });

    // Get user list
    socket.on('get users', function(users) {
        var html = '<ul id="users" style="list-style-type: none;">';
        for (var i = 0; i < users.length; i++) {
            html += '<li>' + users[i] + '</li>';
        };
        html += '</ul>';
        $('#userlist').html(html);
    });

    // Load previous messages
    socket.on('get messages', function(messages) {
        for(var i = 0; i < messages.length; i++) {
        	// Determine where the messages are from
            if (messages[i].user == $('#username').val()) {
                $('#messages').append('<div class="list">\
                <p class="user-name text-right">' + messages[i].user + '</p>\
                <div class="section section-self">' + messages[i].msg + '</div>\
                </div>');
            } else {
                $('#messages').append('<div class="list">\
                <p class="user-name text-left">' + messages[i].user + '</p>\
                <div class="section">' + messages[i].msg + '</div>\
                </div>');
            };
        };

        var elem = document.getElementById('message_board');
        elem.scrollTop = elem.scrollHeight;
    });

    // Append new message to message board
	socket.on('chat message', function(data) {
        if (data.user == $('#username').val()) {		// New message from other users
		    $('#messages').append('<div class="list">\
            <p class="user-name text-right">' + data.user + '</p>\
            <div class="section section-self">' + data.msg + '</div>\
            </div>');
        } else {		// New message from self
            $('#messages').append('<div class="list">\
            <p class="user-name text-left">' + data.user + '</p>\
            <div class="section">' + data.msg + '</div>\
            </div>');

            // Notify new messages if user is not in current tab
            if (document.hidden) {
            	document.title = '(New) ' + document.title;
            };
        };

	    var elem = document.getElementById('message_board');
	    elem.scrollTop = elem.scrollHeight;
	});

	// Dismiss new message notification
	document.addEventListener('visibilitychange', function() {
			if (document.visibilityState == 'visible') {
				document.title = 'ChatColate';
			};
		}, false);

	// New user online message
	socket.on('online message', function(data) {
		$('#messages').append('<div class="list text-center">\
            <div class="info">User <strong>' + data.user + '</strong> is now online.</div>\
            </div>');

        var elem = document.getElementById('message_board');
        elem.scrollTop = elem.scrollHeight;
	});

	// A user offline message
	socket.on('offline message', function(data) {
		$('#messages').append('<div class="list text-center">\
            <div class="info">User <strong>' + data.user + '</strong> just went offline.</div>\
            </div>');

        var elem = document.getElementById('message_board');
        elem.scrollTop = elem.scrollHeight;
	});

	
});


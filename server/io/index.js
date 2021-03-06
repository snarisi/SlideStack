'use strict';
var socketio = require('socket.io');
var session = require('../app/configure/authentication/session');
var sharedSession = require('express-socket.io-session');
var mongoose = require('mongoose');
var User = mongoose.model('Users');
var io = null;

module.exports = function (server) {

    if (io) return io;

    io = socketio(server);

    // Attach socket.io-session middleware
    io.use(sharedSession(session, { autoSave: true }));

    // put the user data on socket.user
    io.use(function (socket, next) {

        //skip if this has already happened
        if (socket.user) return next();
        if (!socket.handshake.session.passport) return next();

        var userId = socket.handshake.session.passport.user;
        User.findById(userId)
            .then(user => {
                socket.user = user.sanitize();
                socket.user.socket = socket.id;
                next();
            });
    });

    var allRooms = {};
    /*
    {
        roomID1: {
            teacher: teacherObj,
            students: [studentObj1, studentObj2]
        }
    }
    */

    io.on('connection', function (socket) {

    	var room;
        var userId;
        // Now have access to socket, wowzers!

        socket.on('login', function (userData) {
            socket.handshake.session.userdata = userData;
        });

        socket.on('teacher slide change', function(newIdx){
        	socket.broadcast.to(room).emit('slide change', newIdx);
        });

        socket.on('request join', function(obj) {

        	room = obj.presentation;
            userId = socket.user._id;

            if (!allRooms[room]) allRooms[room] = { students: [] };

        	socket.join(room);

        	if (!obj.teacher) {
                var teacher = allRooms[room].teacher;
                allRooms[room].students.push(socket.user);
                if (teacher) {
                    socket.broadcast.to(teacher.socket).emit('student joined', socket.user);
                }
        	}

            if (obj.teacher) {
                allRooms[room].teacher = socket.user;
                allRooms[room].students.forEach(function (student) {
                    io.to(allRooms[room].teacher.socket).emit('student joined', student);
                });
            }
        });

        socket.on('editing code', function (code) {
            socket.broadcast.to(room).emit('code change', code);
        });

        socket.on('call on', function (socketId) {
            io.to(socketId).emit('called');
        });

        socket.on('end call on', function (socketId) {
            io.to(socketId).emit('not called');
        });

        socket.on('question', function(data) {
            io.to(allRooms[room].teacher.socket).emit('question asked', data);
        });

        socket.on('confusion', function(student) {
            io.to(allRooms[room].teacher.socket).emit('student confused', student);
        });

        socket.on('understand', function(student) {
            io.to(allRooms[room].teacher.socket).emit('student understands', student);
        });

        socket.on('disconnect', function(){
        	io.sockets.to(room).emit('somebody left', userId);
            if (allRooms[room]) allRooms[room].students = allRooms[room].students.filter(function (student) {
                return student._id !== userId;
            });
        });

    });

    return io;

};

const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const formatMessage = require('./utils/messages');
const { userJoin, currentUser, userLeave, getRooomUsers } = require('./utils/users');

const port = process.env.port || 8000;

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.json());
app.set(express.urlencoded({ extended: false }));

//set static folder
app.use(express.static(path.join(__dirname, "./public")));
const botName = "RJ Chat";

// Run when client connect
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        //Weklcome corrent user
        socket.emit('message', formatMessage(botName, 'welcome to ChatCord!'));

        //Broadcast when user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has joined chat`));

        // send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRooomUsers(user.room)
        });
    });

    //listen for chatMessage
    socket.on('chatMessage', msg => {
        const user = currentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg))
    });

    //Broadcast when user connects
    socket.on("disconnect", () => {
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat...`));

            // send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRooomUsers(user.room)
            });
        };
    });
});

server.listen(port, () => {
    console.log(` your port ${8000} is running successfuly...`);
});
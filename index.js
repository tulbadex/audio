const express = require('express');
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const { send } = require('process');

const app = express();

const server = require('http').Server(app)
const io = require('socket.io')(server)

var corsOptions = {
    origin: "http://localhost:8081"
};

app.use(cors(corsOptions));

app.set('view engine', 'ejs')
app.use(express.static('public'))

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

require('./routes/auth')(app);
// require('./app/routes/user.routes')(app);

const db = require("./models");
const Role = db.role;

/* db.sequelize.sync({ force: true }).then(() => {
    console.log('Drop and Resync Db');
    initial();
});

function initial() {
    Role.create({
        id: 1,
        name: "user"
    });

    Role.create({
        id: 2,
        name: "moderator"
    });

    Role.create({
        id: 3,
        name: "admin"
    });
} */



io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('join-room', (roomId, userId) => {
        console.log('a user connected' + roomId + ' ' + userId);
        socket.join(roomId)
        socket.to(roomId).broadcast.emit('user-connected', userId)
    })
});



/* server.listen(3000, () => {
    console.log('listening on *:3000');
}); */

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
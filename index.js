const os = require('os');
const express = require('express');
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const adapter = require('webrtc-adapter');
// import adapter from 'webrtc-adapter';
const path = require('path');

const app = express();

const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const WebSocketServer = require('websocket').server;

// wait for when a connection request comes in 
new WebSocketServer({
    httpServer: app, 
    autoAcceptConnections: false 
}).on('request', onRequest);

const PORT = process.env.PORT || 8080;

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
require('./routes/user')(app);

app.get('/', (req, res) => {
    // console.log(adapter.browserDetails.browser)
    res.sendFile(path.join(__dirname+'/view/index.html'));
});

const db = require("./models");
const Role = db.role;
// db.sequelize.sync({ force: true })
db.sequelize.sync({ force: false }).then(() => {
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
}


// callback function to run when we have a successful websocket connection request
function onRequest(socket) {

    // get origin of request 
    var origin = socket.origin + socket.resource;

    // accept socket origin 
    var websocket = socket.accept(null, origin);

    // websocket message event for when message is received
    websocket.on('message', function(message) {
        if(!message || !websocket) return;

        if (message.type === 'utf8') {
            try {
                // handle JSON serialization of messages 
                onMessage(JSON.parse(message.utf8Data), websocket);
            }
            // catch any errors 
            catch(e) {}
        }
    });
    // websocket event when the connection is closed 
    websocket.on('close', function() {
        try {
            // close websocket channels when the connection is closed for whatever reason
            truncateChannels(websocket);
        }
        catch(e) {}
    });
}

// callback to run when the message event is fired 
function onMessage(message, websocket) {
    if(!message || !websocket) return;

    try {
        if (message.checkPresence) {
            checkPresence(message, websocket);
        }
        else if (message.open) {
            onOpen(message, websocket);
        }
        else {
            sendMessage(message, websocket);
        }
    }
    catch(e) {}
}



/* server.listen(3000, () => {
    console.log('listening on *:3000');
}); */

// set port, listen for requests
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
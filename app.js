//setting up express and socketio
var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

app.use("/public/scripts", express.static(__dirname + '/public/scripts'));
app.use("/public/css", express.static(__dirname + '/public/css'));
/////////////////////////////////////////////////////////////////////////////////
//Globals////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
//prototype for a user
function User() {
    this.username = null,
        this.secret = null,
        this.roomID == null //current room the user is in
};

//prototype for a room
function Room() {
    this.userList = [],
        this.roomID = null
}
//list of rooms change
roomList = [];
//list of everyone who connects to the server
users = {};


////////////////////////////////////////////////////////////////////////////////
//routing etc///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/views/index.html')
});

app.get('/test*', (req, res) => {
    res.sendFile(__dirname + '/views/test.html');
});

server.listen(process.env.PORT || 8080);

////////////////////////////////////////////////////////////////////////////////
//socketio stuff////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
io.sockets.on('connection', function(socket) {
    //console.log("user connected, ID: " + socket.id);

    //listen for when a user joins a room
    socket.on('joinRoom', function(roomID) {
        console.log(roomList[roomID].userList.length);
        if(roomList[roomID].userList.length > 1) {
            console.log("hey");
            io.to(socket.id).emit('tooManyUsers');
            socket.disconnect();
            return;
        }
        var currentUser = addToList(socket, roomID);
        socket.join(currentUser.roomID);
        users[socket.id] = currentUser;

        //emit to the room that a new user has joined.
        io.to(currentUser.roomID).emit('newUser', currentUser.username, currentUser.roomID);
        io.to(currentUser.roomID).emit('updateUsers', roomList[currentUser.roomID].userList);
        //console.log(roomList);
        //console.log(users);

    });

    socket.on('createRoom', function() {
        //add the user to the list for that room
        var currentUser = addToList(socket, socket.id);

        //join the specified room
        socket.join(currentUser.roomID);
        users[socket.id] = currentUser;

        //emit to the room that a new user has joined.
        io.to(currentUser.roomID).emit('newUser', currentUser.username, currentRoom.roomID);
        io.to(currentUser.roomID).emit('updateUsers', roomList[currentUser.roomID].userList);
        //console.log(roomList);
        //console.log(users);
    });

    //when a message is sent, show it to the client
    socket.on('sendMessage', function(msg) {
            io.to(users[socket.id].roomID).emit('recieveMessage', msg, socket.username);

    });

    socket.on('disconnect', function() {
        console.log("user disconnected, ID" + socket.id);
        if ([socket.id].username != undefined) {
            //remove this user from the list
            removeFromList(socket.username, users[socket.id]);
            //remove user from the session
            //removeUser(users[socket.id]);
            io.in(users[socket.id].roomID).emit('userDisconnected', socket.username);
            io.to(users[socket.id].roomID).emit('updateUsers', roomList[users[socket.id]].userList);
        }
    });

});

////////////////////////////////////////////////////////////////////////////////
//helper functions//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


//small function to add a user to a room and the room to the room list
function addToList(socket, roomID) {
    currentUser = new User;
    currentUser.username = socket.id.substring(0, 6);
    currentUser.roomID = roomID;
    //set the socket username
    socket.username = currentUser.username;
    //if the room does not already exist...
    if (roomList[roomID] === undefined) {
        //...create the room and place the user in it
        currentRoom = new Room;
        currentRoom.userList.push(socket.username);
        currentRoom.roomID = roomID;
        roomList[(roomID)] = currentRoom;
    } else {
        //..else just push them to the userlist for that room
        roomList[(roomID)].userList.push(socket.username);
    }
    return currentUser;
}

//find the name of the user in the list of users for that room and remove them
function removeFromList(username) {
    var name = roomList[username].userList.indexOf(username);
    roomList[username].userList.splice(name, 1);
}

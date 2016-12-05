//setting up express and socketio
var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server);

app.use("/scripts", express.static(__dirname + '/scripts'));
app.use("/css", express.static(__dirname + '/css'));
/////////////////////////////////////////////////////////////////////////////////
//Globals////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
//prototype for a user
function User() {
    this.username = null,
        this.roomID = null,
        this.secret = null
};

//prototype for a room
function Room() {
    this.userList = [],
        this.roomID = null
}
//list of rooms
roomList = [];
//list of everyone who connects to the server
users = {};


////////////////////////////////////////////////////////////////////////////////
//routing etc///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/views/index.html')
});

server.listen("3000");

////////////////////////////////////////////////////////////////////////////////
//socketio stuff////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
io.sockets.on('connection', function(socket) {
    console.log("user connected, ID: " + socket.id);

    //listen for when a user joins a room
    socket.on('joinRoom', function(username, roomID) {
        //!!!!!!! check to see if that username is already taken
        //add the user to the list for that room
        currentUser = addToList(username, roomID, socket);
        //join the specified room
        socket.join(roomID);
        users[socket.id] = currentUser;

        //emit to the room that a new user has joined.
        io.to(roomID).emit('newUser', currentUser.username, currentRoom.roomID);
        io.to(roomID).emit('updateUsers', roomList[roomID].userList);
    });

    //when a message is sent, show it to the client
    socket.on('sendMessage', function(msg) {
        io.in(users[socket.id].roomID).emit('recieveMessage', msg, socket.username);
    })

    socket.on('disconnect', function(){
        console.log("user disconnected, ID" + socket.id);
        removeFromList(socket.username, users[socket.id].roomID);
        io.in(users[socket.id].roomID).emit('userDisconnected', socket.username);
        io.to(users[socket.id].roomID).emit('updateUsers', roomList[users[socket.id].roomID].userList);
    });

});

////////////////////////////////////////////////////////////////////////////////
//helper functions//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////


//small function to add a user to a room and the room to the room list
function addToList(username, roomID, socket) {
    currentUser = new User;
    currentUser.username = username;
    //set the socket username
    socket.username = username;
    currentUser.roomID = roomID;
    //if the room does not already exist...
    if (roomList[currentUser.roomID] === undefined) {
        //...create the room and place the user in it
        currentRoom = new Room;
        currentRoom.userList.push(currentUser.username);
        currentRoom.roomID = currentUser.roomID;
        roomList[(currentUser.roomID)] = currentRoom;
    } else {
        //..else just push them to the userlist for that room
        roomList[(currentUser.roomID)].userList.push(currentUser.username);
    }
    return currentUser;
}

//find the name of the user in the list of users for that room and remove them
function removeFromList(username, roomID) {
    var name = roomList[roomID].userList.indexOf(username);
    roomList[roomID].userList.splice(name, 1);
}

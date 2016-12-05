//setting up express and socketio
var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);
//body parser because express doesnt support middleware now for whatever reason
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

/////////////////////////////////////////////////////////////////////////////////
//Globals////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
//prototype for a user
function User(username, roomID) {
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
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//routing etc///////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
app.get('/', function(req, res){
    res.sendFile(__dirname + '/views/index.html')
});

app.post('/Whistler', function(req, res){
    //create a new user
    currentUser = new User;
    currentUser.username = req.body.username;
    currentUser.roomID = req.body.roomID;
    //check to see if that roomID already exists. if it does, place the user in that room
    if(roomList[currentUser.roomID] === undefined)
    {
        //create the room and place the user in it
        currentRoom = new Room;
        currentRoom.userList.push(currentUser);
        currentRoom.roomID = currentUser.roomID;
        console.log(currentUser.roomID);
        roomList[(currentUser.roomID)] = currentRoom;
    }
    else {
        //else just push them to the userlist for that room
        roomList[(currentUser.roomID)].userList.push(currentUser);
    }
    //console.log(currentUser);
    console.log(roomList);
    res.sendFile(__dirname + '/views/chatRoom.html');
});

server.listen("3000");
////////////////////////////////////////////////////////////////////////////////
//socketio stuff////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

//when a new socket connects...
io.sockets.on('connection', function(socket){

    console.log();
});

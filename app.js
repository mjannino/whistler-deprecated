//requires
//const ejs = require('ejs');
const express = require('express');
const app = express();
const http = require('http').Server(app);
//expose and bind socket.io to the http server
const io = require('socket.io')(http);
//bodyparser to get post data
const bodyParser = require('body-parser');
app.use(bodyParser.json() );
app.use(bodyParser.urlencoded ({
    extended: true
}));
app.set('view engine', 'ejs');

//listening on port 3000
http.listen(3000, function(){
    console.log("listening on 3000");
});




//list of usernames of users currently in the room
var usernames = {};
var username;

//routing
app.get('/', function (req, res) {
    res.render('chatroom', {username:username});
});

// app.get('/chatroom', function (req, res) {
//     res.sendFile(__dirname + "/chatroom.html");
//
// });
//get the username
app.post('/login', function(req, res) {
    username = req.body.name;
    usernames[username] = username;
    res.render('chatroom',{username:username});
});

//socket stuff
io.on('connection', function(socket){
        console.log("user connected ");
        socket.emit('updateUsers', usernames);

        socket.on('disconnect', function(){
        console.log("user disconnected");
    });
});

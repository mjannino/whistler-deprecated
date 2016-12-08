import CryptoSession from './crypto.js';
//connect the client to the server
var socket = io();


//when a new user joins, display a welcome message
socket.on('newUser', function(user, roomID) {
    $('div#joinForm').remove();
    $('div#chatBox').append('<p class="important">New user ' + user + ' has joined room ' + roomID + '</p>');

});

//when a new message is recieved from the server, display it with
//the username that broacasted it
socket.on('recieveMessage', function(msg, user) {
    //decrypt the message
    CryptoSession.decrypt(msg);
    $('div#chatBox').append('<p class="important">' + user + ': </p><p>' + msg + '</p>');
    $('div#chatBox').animate({
        scrollTop: $('div#chatBox').height()
    }, 1000);
});

//when a new user joins, update the list of users currently in the room
socket.on('updateUsers', function(list) {
    $('div#userList').empty();
    $('div#userList').append('<p>Users:</p>')
    $.each(list, function(key, value) {
        $('div#userList').append('<p class="important">' + value + '</p>');
    });
});

socket.on('userDisconnected', function(username) {
    $('div#chatBox').append('<p class="important">User ' + username + ' has disconnected </p>');
});

//submit the form to join a room
$('button#create').click(function() {
    $('div#joinModal').hide();

    socket.emit('joinRoom');

})

//submit a message
$("input#textBar").keyup(function(event){
        if(event.keyCode == 13){
            $("button#sendMessage").click();
        }
});
$('button#sendMessage').click(function() {
    var msg = $('input#textBar').val();
    //clear the text box
    $('input#textBar').val('');

    //encrypt the message before sending
    CryptoSession.encrypt(msg);
    socket.emit('sendMessage', msg);
});

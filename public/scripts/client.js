import CryptoSession from './crypto.js';

export default class App {

  constructor() {
    this.socket = io();
    this.init();
  }


  init(){

    let self = this;

    //when a new user joins, display a welcome message
    self.socket.on('newUser', function(user, roomID) {
        $('div#chatBox').append('<p class="important">New user ' + user + ' has joined room ' + roomID + '</p>');
        $('div#joinForm').remove();
    });

    //when a new message is recieved from the server, display it with
    //the username that broacasted it
    self.socket.on('recieveMessage', function(msg, user) {
            $('div#chatBox').append('<p class="important">' + user + ': </p><p>' + msg + '</p>');
            $('div#chatBox').animate({scrollTop: $('div#chatBox').height()}, 1000);
    });

    //when a new user joins, update the list of users currently in the room
    self.socket.on('updateUsers', function(list) {
        $('div#userList').empty();
        $('div#userList').append('<p>Users:</p>')
        $.each(list, function(key, value) {
            $('div#userList').append('<p class="important">' + value + '</p>');
        });
    });

    self.socket.on('userDisconnected', function(username) {
        $('div#chatBox').append('<p class="important">User ' + username + ' has disconnected </p>');
    });

    //submit the form to join a room
    $('button#join').click(function() {
        $('div#joinModal').hide();
        var roomID = $('input#roomID').val();
        self.socket.emit('joinRoom', roomID);

    });

    $('button#create').click(function () {
        self.socket.emit('createRoom');
    });


    //submit a message
    $("input#textBar").keyup(function(event){
            if(event.keyCode == 13){
                $("button#sendMessage").click();
            }
    });
    $('button#sendMessage').click(function() {
        var msg = $('input#textBar').val();
            console.log(msg);
            //clear the text box
            $('input#textBar').val('');
            self.socket.emit('sendMessage', msg);
    });
  }
}

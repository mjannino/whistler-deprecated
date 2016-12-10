import CryptoSession from './crypto.js';
import Cryptographics from './cryptographics.js';
export default class App {

  constructor() {
    this.socket = io();
    this.transmitObject = {};
    this.transmitObject.keyBuf = "";
    this.transmitObject.initVector = [];
    this.transmitObject.cipherText = "";
    this.encoder = new Cryptographics();


        this.init();
  }


  init(){

    let self = this;

    self.socket.on('connect', function(){
      console.log("Connected to server");
    });

    //when a new user joins, display a welcome message
    self.socket.on('newUser', function(user, roomID) {
        $('div#chatBox').append('<span class="important">New user ' + user + ' has joined room ' + roomID + '</span><br/>');
        $('div#joinForm').remove();
    });

    // self.socket.on('sendAndEncrypt', function(msg){
    //     self.encoder.generateKey();
    //     self.encoder.encrypt(msg);
    //     self.transmitObject.keyBuf = self.encoder.keyBuf;
    //     self.transmitObject.initVector = self.encoder.initVector;
    //     self.transmitObject.cipherTextBase64 = self.encoder.cipherText;
    // });
    //
    // self.socker.on('recieveAndDecrypt', function(transmitObject){
    //     self.encoder.keyBuf = transmitObject.keyBuf;
    //     self.encoder.initVector = transmitObject.initVector;
    //     self.encoder.decrypt(transmitObject.cipherText);
    // });

    //when a new message is recieved from the server, display it with
    //the username that broacasted it
    self.socket.on('recieveMessage', function(msg, user) {
            $('div#chatBox').append('<span class="important">' + user + ': ' + msg + '</span><br/>');
            $('div#chatBox').animate({scrollTop: $('div#chatBox').height()}, 1000);
    });

    //when a new user joins, update the list of users currently in the room
    self.socket.on('updateUsers', function(list) {
        $('div#userList').empty();
        $('div#userList').append('<span>Users:</span><br/>')
        $.each(list, function(key, value) {
            $('div#userList').append('<p class="important">' + value + '</p>');
        });
    });

    self.socket.on('userDisconnected', function(username) {
        $('div#chatBox').append('<span class="important">User ' + username + ' has disconnected </span><br/>');
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

import _ from 'lodash';
import without from 'lodash.without';

//USAGE:

// cryptoSession.encodeMessage(message).then((socketData) => {
//   message.val('');
//   $('#send-message-btn').removeClass('active');
//   // Add escaped message since message did not come from the server
//   this._chat.addChatMessage({
//     username: username,
//     message: escape(cleanedMessage)
//   });
//   this._socket.emit('new message', socketData);
// }).catch((err) => {
//   console.log(err);
// });

//crypto class using the WebCrypto API
//this class contains much logic gathered
//from varius security and cryptography courses
//on the internet, and some working examples,
//namely the Darkwire codebase, TorchNote codebase, and the Spindle blog
//DW: https://www.reddit.com/r/TOR/comments/41ootz/darkwireio_encrypted_anonymous_chat/
//TorchNote: https://github.com/spencerthayer/TorchNoteJS
//Spindle: https://wearespindle.com/articles/end-to-end-encryption-between-node-js-and-webcrypto

export default class CryptoSession {
  constructor() {

    this._currentUserId = false;
    this._connected = false;
    this._users = {};
    this._keys = {};
    this._crypto = window.crypto || false;

    //if crypto is not supported by this browser
    //we need to override each action
    //this will happen on each step

    if (!this._crypto || (!this._crypto.subtle && !this._crypto.webkitSubtle)) {
      $('#no-crypto').modal({
        backdrop: 'static',
        show: false,
        keyboard: false
      });

      $('#no-crypto').modal('show');
      return;
    }
  }

  addUser(state) {
    let importKeysPromises = [];

    //Users exist in a 'state' object throughout the application
    //Server-side, they are just a collection of Users
    //Client-side and crypto class needs to keep track of more info
    //User keys, etc. Server doesn't need or want to know this information
    //When adding a user, it's important to figure out if t his is the first user
    //If it's the first user, we need to set up the state to keep track of more users
    //All of these users keep track of public keys

    _.each(state.users, (user) => {

      //if there is no user with this ID, we need to asynchronously
      //reach out to our webcrypto instance and add the primary key
      //then we need to add the user to the current user state

      if (!(this._users[id])) {

        let promise = new Promise((resolve, reject) => {
          let currentUser = user;
          Promise.all([
            this.importPrimaryKey(currentUser.publicKey, 'spki')
          ])
          .then((keys) => {
            this._users.push({
              id: currentUser.id,
              username: currentUser.username,
              publicKey: keys[0]
            });
            resolve();
          });
        });

        importKeysPromises.push(promise);
      }
    });

    //the obvious part, if there is no current user, this is a new session
    //so establish the user

    if (!this._currentUserId) {
      let me = _.find(data.users, {username: username});
      this._currentUserId = me.id;
    }

    return importKeysPromises;
  }

  //this part creates the user asyncrhonously; this needs to interface
  //with our socket events.
  //each user has keys they need associated with them--it is VERY important
  //that this crypto module handles this.

  createUserSession(resolve, reject, username) {
    Promise.all([
      this.createPrimaryKeys() //webcrypto wrapper
    ])
    .then((keys) => {
      //when primary keys are created, they need to be established and attached
      //to the current session
      this._keys = {
        public: keys[0].publicKey,
        private: keys[0].privateKey
      };
      return Promise.all([
        this.exportKey(keys[0].publicKey, 'spki')
      ]);
      //the wrapper for exportKey takes the immutable non-readable webcrypto objects
      //and gives the public keys to us as something we can package and use
      //these keys are used to sign messages
    })
    .then((exportedKeys) => {
      if (!exportedKeys) {
        return reject('ERR_CreateUserSession: Could not create keys in user session');
      }

      return resolve({
        username: username,
        publicKey: exportedKeys[0]
      });
    });
  }

  checkConnectedUsers(username) {
    //is anyone connected?

    let matches = _.find(this._users, (users) => {
      return username.toLowerCase() === users.username.toLowerCase();
    });
    if (matches && matches.username) {
      return matches;
    }
    return false;

  }

  removeUser(data) {
    this._users = without(this._users, _.find(this._users, {id: data.id}));
    return this._users;
  }


  /**
  *
  *ENCRYPTION AND DECRYPTION OF MESSAGES
  *
  *
  **/

  encrypt(message, options) {

    //this promise is a chain that defers action
    //until the entire crypto process has been followed through with

    return new Promise((resolve, reject) => {
      options = options || {};

      //don't want to send messages without connection or message
      if (message && this._connected) {

        let secretKey = null;
        let secretKeys = null;
        let messageData = null;
        let signature = null;
        let signingKey = null;
        let encryptedMessageData = null;
        //this vector is the random seed using webcrypto random numbers
        let vector = this.crypto.getRandomValues(new Uint8Array(16));
        let messagePreEncryption = {
          text: escape(message),
          options: options
        }
        messagePreEncryption = JSON.stringify(messagePreEncryption);
        // Generate new secret key and vector for each message

        //Beginning of encryption logic
        //Create a secret key using webcrypto async
        //After, create a signingkey using webcrypto
        //with this signing key, we need to make a promise for the other user
        //we only allow two users, but we need to make sure we don't sign the message
        //with our own public key. if we do that, then it completely invalidated
        //the signature and encyption algorithm as a whole. bad idea!
        //
        //Export secret key
        //encrypt this secret key
        //export signing key after getting secret key in plain text
        //encyrpt this signing key

        this.createSecretKey()

          .then((key) => {
            secretKey = key;
            return this.createSigningKey();
          })

          .then((key) => {
            signingKey = key;
            // Generate secretKey and encrypt with each user's public key
            let promises = [];
            _.each(this._users, (user) => {
              // If not me
              if (user.username !== window.username) {
                let promise = new Promise((res, rej) => {
                  let thisUser = user;

                  let secretKeyStr;

                  // Export secret key
                  this.exportKey(secretKey, 'raw')
                    .then((data) => {
                      return this.encryptSecretKey(data, thisUser.publicKey);
                    })
                    .then((encryptedSecretKey) => {
                      let encData = new Uint8Array(encryptedSecretKey);
                      secretKeyStr = this.convertArrayBufferViewToString(encData);
                      // Export HMAC signing key
                      return this.exportKey(signingKey, 'raw');
                    })
                    .then((data) => {
                      // Encrypt signing key with user's public key
                      return this.encryptSigningKey(data, thisUser.publicKey);
                    })
                    .then((encryptedSigningKey) => {
                      let encData = new Uint8Array(encryptedSigningKey);
                      var str = this.convertArrayBufferViewToString(encData);
                      res({
                        id: thisUser.id,
                        secretKey: secretKeyStr,
                        encryptedSigningKey: str
                      });
                    });
                });
                promises.push(promise);
              }
            });
            return Promise.all(promises);
          })
          .then((data) => {
            secretKeys = data;
            messageData = this.convertStringToArrayBufferView(messagePreEncryption);
            return this.signKey(messageData, signingKey);
          })
          .then((data) => {
            signature = data;
            return this.encryptMessage(messageData, secretKey, vector);
          })
          .then((data) => {
            encryptedMessageData = data;
            let vct = this.convertArrayBufferViewToString(new Uint8Array(vector));
            let sig = this.convertArrayBufferViewToString(new Uint8Array(signature));
            let msg = this.convertArrayBufferViewToString(new Uint8Array(encryptedMessageData));

            resolve({
              message: msg,
              vector: vct,
              secretKeys: secretKeys,
              signature: sig
            });
          });
      }

    });
  }

  //reverse encryption algorithm

  decrypt(data) {
    return new Promise((resolve, reject) => {
      let message = data.message;
      let messageData = this.convertStringToArrayBufferView(message);
      let username = data.username;
      let senderId = data.id;
      let vector = data.vector;
      let vectorData = this.convertStringToArrayBufferView(vector);
      let secretKeys = data.secretKeys;
      let decryptedMessageData;
      let decryptedMessage;

      let mySecretKey = _.find(secretKeys, (key) => {
        return key.id === this._currentUserId;
      });
      let signature = data.signature;
      let signatureData = this.convertStringToArrayBufferView(signature);
      let secretKeyArrayBuffer = this.convertStringToArrayBufferView(mySecretKey.secretKey);
      let signingKeyArrayBuffer = this.convertStringToArrayBufferView(mySecretKey.encryptedSigningKey);

      this.decryptSecretKey(secretKeyArrayBuffer, this._keys.private)
      .then((data) => {
        return this.importSecretKey(new Uint8Array(data), 'raw');
      })
      .then((data) => {
        let secretKey = data;
        return this.decryptMessage(messageData, secretKey, vectorData);
      })
      .then((data) => {
        decryptedMessageData = data;
        decryptedMessage = JSON.parse(this.convertArrayBufferViewToString(new Uint8Array(data)));
        return this.decryptSigningKey(signingKeyArrayBuffer, this._keys.private);
      })
      .then((data) => {
        return this.importSigningKey(new Uint8Array(data), 'raw');
      })
      .then((data) => {
        let signingKey = data;
        return this.verifyKey(signatureData, decryptedMessageData, signingKey);
      })
      .then((bool) => {
        if (bool) {
          resolve({
            username: username,
            message: decryptedMessage,
          });
        }
      });
    });
  }

  /**
  *Conversion utility functions
  *from StackOverflow and various tutorials
  *TODO: implement UTF-8 support
  *      currently, it is byte wise, UTF-8 more complex
  **/

  convertStringToArrayBufferView(str) {
    let bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
      bytes[i] = str.charCodeAt(i);
    }
    return bytes;
  }

  convertArrayBufferViewToString(buffer) {
    let str = '';
    for (let i = 0; i < buffer.byteLength; i++) {
      str += String.fromCharCode(buffer[i]);
    }
    return str;
  }

  /**
  *
  *WEBCRYPTO
  *WRAPPER functions from WebCrypto docs,
  *Spindle blog, and DW codebase
  *
  **/

  createSigningKey() {
    return this._crypto.subtle.generateKey(
      {
        name: 'HMAC',
        hash: {name: 'SHA-256'}, //can be 'SHA-1', 'SHA-256', 'SHA-384', or 'SHA-512'
        //length: 256, //optional, if you want your key length to differ from the hash function's block length
      },
      true, //whether the key is extractable (i.e. can be used in exportKey)
      ['sign', 'verify'] //can be any combination of 'sign' and 'verify'
    );
  }

  createPrimaryKeys() {
    return this._crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048, //can be 1024, 2048, or 4096
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: {name: 'SHA-256'}, //can be 'SHA-1', 'SHA-256', 'SHA-384', or 'SHA-512'
      },
      true, //whether the key is extractable (i.e. can be used in exportKey)
      ['encrypt', 'decrypt'] //must be ['encrypt', 'decrypt'] or ['wrapKey', 'unwrapKey']
    );
  }

  createSecretKey() {
    return this._crypto.subtle.generateKey(
      {
        name: 'AES-CBC',
        length: 256, //can be  128, 192, or 256
      },
      true, //whether the key is extractable (i.e. can be used in exportKey)
      ['encrypt', 'decrypt'] //can be 'encrypt', 'decrypt', 'wrapKey', or 'unwrapKey'
    );
  }

  encryptSecretKey(data, secretKey) {
    // Secret key will be recipient's public key
    return this._crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: {name: 'SHA-256'}
      },
      secretKey,
      data //ArrayBuffer of data you want to encrypt
    );
  }

  decryptSecretKey(data, key) {
    // key will be my private key
    return this._crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: {name: 'SHA-256'}
        //label: Uint8Array([...]) //optional
      },
      key,
      data //ArrayBuffer of the data
    );
  }

  encryptSigningKey(data, signingKey) {
    // Secret key will be recipient's public key
    return this._crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: {name: 'SHA-256'}
      },
      signingKey,
      data //ArrayBuffer of data you want to encrypt
    );
  }

  decryptSigningKey(data, key) {
    // key will be my private key
    return this._crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: {name: 'SHA-256'}
        //label: Uint8Array([...]) //optional
      },
      key,
      data //ArrayBuffer of the data
    );
  }

  encryptMessage(data, secretKey, iv) {
    return this._crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        //Don't re-use initialization vectors!
        //Always generate a new iv every time your encrypt!
        iv: iv,
      },
      secretKey, //from generateKey or importKey above
      data //ArrayBuffer of data you want to encrypt
    );
  }

 decryptMessage(data, secretKey, iv) {
    return this._crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: iv, //The initialization vector you used to encrypt
      },
      secretKey, //from generateKey or importKey above
      data //ArrayBuffer of the data
    );
  }

  importSecretKey(jwkData, format) {
    return this._crypto.subtle.importKey(
      format || 'jwk', //can be 'jwk' or 'raw'
      //this is an example jwk key, 'raw' would be an ArrayBuffer
      jwkData,
      {   //this is the algorithm options
        name: 'AES-CBC',
      },
      true, //whether the key is extractable (i.e. can be used in exportKey)
      ['encrypt', 'decrypt'] //can be 'encrypt', 'decrypt', 'wrapKey', or 'unwrapKey'
    );
  }

 importPrimaryKey(jwkData, format) {
    // Will be someone's public key
    let hashObj = {
      name: 'RSA-OAEP'
    };
    if (!this._crypto.webkitSubtle) {
      hashObj.hash = {name: 'SHA-256'};
    }
    return this._crypto.subtle.importKey(
      format || 'jwk', //can be 'jwk' (public or private), 'spki' (public only), or 'pkcs8' (private only)
      jwkData,
      hashObj,
      true, //whether the key is extractable (i.e. can be used in exportKey)
      ['encrypt'] //'encrypt' or 'wrapKey' for public key import or
                  //'decrypt' or 'unwrapKey' for private key imports
    );
  }

  exportKey(key, format) {
    // Will be public primary key or public signing key
    return this._crypto.subtle.exportKey(
      format || 'jwk', //can be 'jwk' (public or private), 'spki' (public only), or 'pkcs8' (private only)
      key //can be a publicKey or privateKey, as long as extractable was true
    );
  }

  importSigningKey(jwkData) {
    return this._crypto.subtle.importKey(
      'raw', //can be 'jwk' (public or private), 'spki' (public only), or 'pkcs8' (private only)
      //this is an example jwk key, other key types are Uint8Array objects
      jwkData,
      {   //these are the algorithm options
        name: 'HMAC',
        hash: {name: 'SHA-256'}, //can be 'SHA-1', 'SHA-256', 'SHA-384', or 'SHA-512'
        //length: 256, //optional, if you want your key length to differ from the hash function's block length
      },
      true, //whether the key is extractable (i.e. can be used in exportKey)
      ['verify'] //'verify' for public key import, 'sign' for private key imports
    );
  }

  signKey(data, keyToSignWith) {
    // Will use my private key
    return this._crypto.subtle.sign(
      {
        name: 'HMAC',
        hash: {name: 'SHA-256'}
      },
      keyToSignWith, //from generateKey or importKey above
      data //ArrayBuffer of data you want to sign
    );
  }

  verifyKey(signature, data, keyToVerifyWith) {
    // Will verify with sender's public key
    return this._crypto.subtle.verify(
      {
        name: 'HMAC',
        hash: {name: 'SHA-256'}
      },
      keyToVerifyWith, //from generateKey or importKey above
      signature, //ArrayBuffer of the signature
      data //ArrayBuffer of the data
    );
  }

  /**
  *GETTERS AND SETTERS
  *
  *
  **/

  getUserById(id) {
    return this._users[id];
  }

  get crypto() {
    return this._crypto;
  }

  get keys() {
    return this._keys;
  }

  set keys(keys) {
    this._keys = keys;
    return this._keys;
  }

  get connected() {
    return this._connected;
  }

  set connected(state) {
    this._connected = state;
    return this._connected;
  }

  get users() {
    return this._users;
  }


}

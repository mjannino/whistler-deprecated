import _ from 'lodash';
import without from 'lodash.without';


export default class Cryptographics{

  constructor(){
    this.roomUserIds = [];
    this.currentUserId = false;
    this.connected = false;
    this.initVector = [];
    this.cipherTextBase64 = "";
    this.decryptedText =  "";
    this.keys = {};
    this.keyBuf = "";
    this.crypto = window.crypto || false;

    //TODO: Implement no crypto modal

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

  //GETTERS AND SETTERS

  // get initVector() {
  //   return this.initVector;
  // }
  //
  // get cipherTextBase64(){
  //   return this.cipherTextBase64;
  // }
  //
  // get keyBuf(){
  //   return this.keyBuf;
  // }
  //
  // get decryptedText(){
  //   return this.decryptedText;
  // }
  //
  // set initVector() {
  //   return this.initVector;
  // }
  //
  // set cipherTextBase64(){
  //   return this.cipherTextBase64;
  // }
  //
  // set keyBuf(){
  //   return this.keyBuf;
  // }
  //
  // set decryptedText(){
  //   return this.decryptedText;
  // }



  //implement a basic encode method to encode a given message
  //implement a basic encode method to decode a given message
  // Cryptographic functionality for lab 1


// When GenerateKey button is clicked, create a new AES-CBC
// 256 bit key, export it, and put a hex encoding of it in
// the Key input field.
generateKey() {
    // Create a CryptoKey
    this.crypto.subtle.generateKey(
        {name: "AES-CBC", length: 256},
        true,
        ["encrypt", "decrypt"]
    ).then(function(key){
        // Export to ArrayBuffer
        return this.crypto.subtle.exportKey(
            "raw",
            key
        );
    }).then(function(buf){
        // Cast to a byte array, place in Key field
        var byteArray = new Uint8Array(buf);
        this.keyBuf = byteArrayToHexString(byteArray);
    }).catch(function(err){
        // Nothing should go wrong... but it might!
        alert("Key generation error: " + err.message);
    });
}


// When the Encrypt button is pressed, create a CryptoKey
// object from the hex encoded data in the Key input field,
// then use that key to encrypt the plaintext. Hex encode the
// random IV used and place in the IV field, and base 64 encode
// the ciphertext and place in the Ciphertext field.
encrypt(message) {
    // Start by getting Key and Plaintext into byte arrays
    var keyBytes = hexStringToByteArray(this.keyBuf);
    var plaintextBytes = stringToByteArray(message);

    // Make a CryptoKey from the Key string
    this.crypto.subtle.importKey(
        "raw",
        keyBytes,
        {name: "AES-CBC", length: 256},
        false,
        ["encrypt"]
    ).then(function(key){
        // Get a random IV, put in IV field, too
        this.initVector = this.crypto.getRandomValues(new Uint8Array(16));

        // Use the CryptoKey to encrypt the plaintext
        return this.crypto.subtle.encrypt(
            {name: "AES-CBC", iv: this.initVector},
            key,
            plaintextBytes
        );
    }).then(function(ciphertextBuf){
        // Encode ciphertext to base 64 and put in Ciphertext field
        ciphertextBytes = new Uint8Array(ciphertextBuf);
        this.cipherTextBase64 = byteArrayToBase64(ciphertextBytes);
        console.log("Encrypted");
    }).catch(function(err){
        alert("Encryption error: " + err.message);
    });
}


// When the Decrypt button is pressed, create a CryptoKey
// object from the hex encoded data in the Key input field,
// decode the hex IV field value to a byte array, decode
// the base 64 encoded ciphertext to a byte array, and then
// use that IV and key to decrypt the ciphertext. Place the
// resulting plaintext in the plaintext field.
decrypt(ciphertextBase64String) {
    // Start by getting Key, IV, and Ciphertext into byte arrays
    var keyField = this.keyBuf;
    var keyBytes = hexStringToByteArray(keyField);
    var ivHexString = this.initVector;
    var ivBytes = hexStringToByteArray(ivHexString);
    var ciphertextBytes = base64ToByteArray(ciphertextBase64String);

    // Make a CryptoKey from the Key string
    this.crypto.subtle.importKey(
        "raw",
        keyBytes,
        {name: "AES-CBC", length: 256},
        false,
        ["decrypt"]
    ).then(function(key){
        // Use the CryptoKey and IV to decrypt the plaintext
        return this.crypto.subtle.decrypt(
            {name: "AES-CBC", iv: ivBytes},
            key,
            ciphertextBytes
        );
    }).then(function(plaintextBuf){
        // Convert array buffer to string and put in Plaintext field
        plaintextBytes = new Uint8Array(plaintextBuf);
        plaintextString = byteArrayToString(plaintextBytes);
        this.decryptedText = plaintextString;
        console.log("Decrypted");
    }).catch(function(err){
        alert("Encryption error: " + err.message);
    });
}

// Various tools to convert string formats to and from
// byte arrays (that is, Uint8Array), since the Web Crypto
// API likes byte arrays, and web pages like strings.


byteArrayToHexString(byteArray) {
    var hexString = '';
    var nextHexByte;
    for (var i=0; i<byteArray.byteLength; i++) {
        nextHexByte = byteArray[i].toString(16);    // Integer to base 16
        if (nextHexByte.length < 2) {
            nextHexByte = "0" + nextHexByte;        // Otherwise 10 becomes just a instead of 0a
        }
        hexString += nextHexByte;
    }
    return hexString;
}

hexStringToByteArray(hexString) {
    if (hexString.length % 2 !== 0) {
        throw "Must have an even number of hex digits to convert to bytes";
    }
    var numBytes = hexString.length / 2;
    var byteArray = new Uint8Array(numBytes);
    for (var i=0; i<numBytes; i++) {
        byteArray[i] = parseInt(hexString.substr(i*2, 2), 16);
    }
    return byteArray;
}

byteArrayToBase64(byteArray){
    var binaryString = "";
    for (var i=0; i<byteArray.byteLength; i++){
        binaryString += String.fromCharCode(byteArray[i]);
    }
    var base64String = window.btoa(binaryString);
    return base64String;
}

base64ToByteArray(base64String){
    var binaryString = window.atob(base64String);
    var byteArray = new Uint8Array(binaryString.length);
    for (var i=0; i<binaryString.length; i++){
        byteArray[i] += binaryString.charCodeAt(i);
    }
    return byteArray;
}

byteArrayToString(byteArray){
    if ("TextDecoder" in window) {
        decoder = new window.TextDecoder;
        return decoder.decode(byteArray);
    }

    // Otherwise, fall back to 7-bit ASCII only
    var result = "";
    for (var i=0; i<byteArray.byteLength; i++){
        result += String.fromCharCode(byteArray[i])
    }
    return result;
}

stringToByteArray(s){
    if ("TextEncoder" in window) {
       encoder = new window.TextEncoder;
       return encoder.encode(s);
    }

    // Otherwise, fall back to 7-bit ASCII only
    var result = new Uint8Array(s.length);
    for (var i=0; i<s.length; i++){
        result[i] = s.charCodeAt(i);
    }
    return result;
}


}

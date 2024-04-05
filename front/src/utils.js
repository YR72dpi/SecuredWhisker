const generateRSAKeys = () => {
    console.log("Generating RSA Keys")
    return new Promise((resolve, reject) => {
      var encrypt = new JSEncrypt();
      encrypt.getKey(function() {
        var publicKey = encrypt.getPublicKey();
        var privateKey = encrypt.getPrivateKey();
        resolve({ publicKey: publicKey, privateKey: privateKey });
      });
    });
    // return { publicKey: "publicKey", privateKey: "privateKey" }
  };

  
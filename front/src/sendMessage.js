const getNeededUser = async (user) => {
    const neededUserData = await fetch("http://localhost:3000/getUser?name="+user).then(data => data.json())
    return neededUserData
}

const encryptMessageFor = async (message, forUser) => {
    
    // Créez une instance de JSRSA
    var rsaEncrypt = new JSEncrypt();

    // Set public key
    var publicKey = atob(forUser.publicKey);

    rsaEncrypt.setPublicKey(publicKey);

    // Encrypt the input text
    var encrypted = rsaEncrypt.encrypt(message);

    // Afficher le texte chiffré
    return encrypted;
}

const send = async (encryptMessageFor, forUser) => {
    var formdata = {
        encryptMessageFor: encryptMessageFor,
        to: forUser,
        from: window.currentUser
    }
    
    var requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // En-tête Content-Type avec la valeur application/json
        },
        body: JSON.stringify(formdata),
      };
  
    await fetch(
        `http://${ window.targetServiceIp}:${ window.targetServicePort}/insertMessage`, 
        requestOptions
        )
        .then(response => response.text())
        .then(async (result) => {
          console.log(result)
        })
        .catch(error => console.log('error', error));
}


(async () => {
    document.getElementById("messageForm").addEventListener("submit", async (evt) => {
        evt.preventDefault()
        const form = evt.target
        const to = form.to.value
        const message = form.message.value

        const neededUser = await getNeededUser(to) // renvoie l'objet prisma
        
        const encryptedMessage = await encryptMessageFor(message, neededUser)
        await send(encryptedMessage, to)
        form.message.value = ""

    })
})()
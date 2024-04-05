


(async () => {
  document.getElementById("registerForm").addEventListener("submit", async (evt) => {
    evt.preventDefault()
    document.getElementById("registerForm").style.display      = "none"
    document.getElementById("loading").style.display      = "block"

    console.log("Sending form")

    const rsaKeys = await generateRSAKeys()
    console.table(rsaKeys)

    // save privateKey in local
    const IndexedDB = new IndexedDBManager("SecureWhisker")
    await IndexedDB.addPrivateKey(rsaKeys.privateKey)

    // save user id
    console.log("Sending Public Key & username")
    var formdata = {
      "username": evt.target.username.value,
      "publicKey": btoa(rsaKeys.publicKey)
    }

    var requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // En-tête Content-Type avec la valeur application/json
      },
      body: JSON.stringify(formdata),
      redirect: 'follow'
    };

    await fetch(
      `http://${evt.target.ip.value}:${evt.target.port.value}/register`, 
      requestOptions
      )
      .then(response => response.text())
      .then(async (result) => {
        console.log(result)
        document.getElementById("registerFormSection").style.display = "none"

        document.getElementById("finalUsername").innerText = result
        document.getElementById("personnalData").style.display      = "block"
        document.getElementById("chatSection").style.display        = "block"
        document.getElementById("messageForm").style.display        = "block"
        document.getElementById("stopCommunication").style.display  = "block"

        await IndexedDB.addIpService(evt.target.ip.value)
        await IndexedDB.addPortService(evt.target.port.value)
        
      })
      .catch(error => console.log('error', error));



    console.log("form send")
  })
})()
const messageContainer = document.getElementById("message_container")

const fetchMessage = async () => {
    const requestOptions = { method: "GET" };

    const messageList = await fetch("http://localhost:3000/myMessage?name=" + window.currentUser, requestOptions)
        .then((response) => response.text())
        .then((result) => result)
        .catch((error) => console.error(error));

    return messageList
}

const decryptMessage = async (messageContent) => {
    const IndexedDB = new IndexedDBManager("SecureWhisker")
    const privateKey = await IndexedDB.getPrivateKey()
    // Créez une instance de JSRSA
    var rsaDecrypt = new JSEncrypt();

    rsaDecrypt.setPrivateKey(privateKey);

    var decrypted = rsaDecrypt.decrypt(messageContent);
    console.log(messageContent)
    console.log(decrypted)
    return decrypted;
}

const messageElement = async (msg) => {


    let p = document.createElement("p")
    let strong = document.createElement("strong")

    let decryptedMsg = await decryptMessage(msg.content)
    let textNode = document.createTextNode(decryptedMsg)

    strong.innerText = msg.from.uniqId + ": "
    strong.setAttribute("data-user", msg.from.uniqId)
    strong.classList.add("messageReceive")

    p.appendChild(strong);
    p.appendChild(textNode);

    return p
}

let messagesShown = [];

(async () => {
    setInterval(async () => {
        if (window.currentUser) {
            const allMessagesJson = await fetchMessage()
            const allMessages = JSON.parse(allMessagesJson)
            if (allMessages.length > 0) {
                allMessages.forEach(async msg => {
                    if (!messagesShown.includes(msg.id)) {
                        let msgHtmlElement = await messageElement(msg)
                        messageContainer.appendChild(msgHtmlElement)
                        messagesShown.push(msg.id)
                    }
                });
            }

            document.querySelectorAll(".messageReceive").forEach(messageReceive => {
                messageReceive.addEventListener("click", (el) => {
                    console.log(el.target)
                    document.getElementById("to").value = el.target.dataset.user
                })
            })
        } else {
            console.log("Wait for register")
        }
    }, 1000)
})()
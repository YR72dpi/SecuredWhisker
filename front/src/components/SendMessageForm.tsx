import { ChangeEvent, FC, FormEvent, useEffect, useState } from "react";
import { Input } from "./ui/input";
import JSEncrypt from "jsencrypt";

interface Data {
  ip: string
  port: string
  username: string,
  userSelected: string
}

export const SendMessageForm: FC<Data> = ({ ip, port, username, userSelected }) => {
  const [formData, setFormData] = useState({
    message: "",
    to: userSelected ?? ""
  });
  const [haveToSend, setSend] = useState(false)
  const [manuallyChangedTargetUser, setManuallyChangedTargetUser] = useState<string>("")

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if(e.target.name === "to") setManuallyChangedTargetUser(e.target.value)

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSend(true)
  };

  const getNeededUser = async (user: string) => {
    const neededUserData = await fetch("http://"+ip+":"+port+"/getUser?name="+user).then(data => data.json())
    return neededUserData
  }
  
  const encryptMessage = async (message: string, forUser: string) => {
      
    // Créez une instance de JSRSA
    var rsaEncrypt = new JSEncrypt();
  
    let userInformation = await getNeededUser(forUser)
  
    // Set public key
    var publicKey = atob(userInformation.publicKey);
  
    rsaEncrypt.setPublicKey(publicKey);
  
    // Encrypt the input text
    var encrypted = rsaEncrypt.encrypt(message);
  
    // Afficher le texte chiffré
    return encrypted;
  }

  useEffect(() => {
    (async () => {
      if (haveToSend) {
        
        var dataToSend = {
          encryptMessage: await encryptMessage(formData.message, manuallyChangedTargetUser !== "" ? manuallyChangedTargetUser : userSelected),
          to: formData.to === "" ? userSelected : formData.to,
          from: username
        }

        var requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json' // En-tête Content-Type avec la valeur application/json
          },
          body: JSON.stringify(dataToSend),
        };

        await fetch(
          `http://${ip}:${port}/insertMessage`,
          requestOptions
        )
          .then(response => response.text())
          .then(async (result) => {
          })
          .catch(error => console.log('error', error));
      }

      setSend(false)
    })()
  }, [haveToSend])

  return (
    <form id="sendMessageForm" method="post" onSubmit={handleSubmit}>
      <Input
        type="text"
        name="to"
        id="toUser"
        placeholder="To"
        value={formData.to}
        onChange={handleChange}
      />
      <Input
        type="text"
        name="message"
        placeholder="Message"
        value={formData.message}
        onChange={handleChange}
      />

      <Input className="hover:bg-slate-600" type="submit" value={"Send"} />
    </form>
  )
}
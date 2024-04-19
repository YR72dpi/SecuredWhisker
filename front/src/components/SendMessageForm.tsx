import { ChangeEvent, FC, FormEvent, useEffect, useState } from "react";
import { Input } from "./ui/input";

interface Data {
  ip: string
  port: string
  username: string,
  toUser: string
}

export const SendMessageForm: FC<Data> = ({ ip, port, username, toUser }) => {
  const [formData, setFormData] = useState({
    message: "",
    to: toUser ? toUser : ""
  });
  const [haveToSend, setSend] = useState(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSend(true)
  };

  useEffect(() => {
    (async () => {
      if (haveToSend) {
        console.log("send Message to " + formData.to)
        var dataToSend = {
          encryptMessageFor: formData.message,
          to: formData.to,
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
            console.log(result)
          })
          .catch(error => console.log('error', error));
      }

      setSend(false)
    })()
  }, [haveToSend])

  return (
    <form id="sendMessageForm" onSubmit={handleSubmit}>
      <Input
        type="text"
        name="to"
        placeholder="To"
        value={formData.to ? formData.to : toUser}
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
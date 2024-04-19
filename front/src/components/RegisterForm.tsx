import { ChangeEvent, FC, FormEvent, useEffect, useState } from "react";
import { Input } from "./ui/input";
import JSEncrypt from "jsencrypt"

interface Saved {
  formSubmitted:            () => void
  registrationStateMessage: (state: string) => void
  chatReady:                () => void

  putUsername:              (state: string) => void
  putIp:                    (ip: string) => void
  putPort:                  (port: string) => void
  putPrivateKey:            (privateKey: string) => void
}

interface RSAKeys {
  publicKey: string
  privateKey: string
}

export const RegisterForm: FC<Saved> = ({
  formSubmitted,
  registrationStateMessage,
  chatReady,

  putUsername,
  putIp,
  putPort,
  putPrivateKey
}) => {
  const [canSend, setCanSend] = useState(false)

  const [formData, setFormData] = useState({
    ip: 'localhost',
    port: '3001',
    username: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLElement
    form.style.display = "none"
    formSubmitted()
    setCanSend(true)
  };

  useEffect(() => {
    console.log(canSend)
    if (canSend) {
      (async () => {
        const generateRSAKeys = (): Promise<RSAKeys> => {
          console.log("Generating RSA Keys")
          return new Promise((resolve, reject) => {
            var encrypt = new JSEncrypt();
            encrypt.getKey(function() {
              var publicKey = encrypt.getPublicKey();
              var privateKey = encrypt.getPrivateKey();
              resolve({ publicKey: publicKey, privateKey: privateKey });
            });
          });
        };

        registrationStateMessage("Generate RSA keys")
        const rsaKeys = await generateRSAKeys()

        console.table([
          rsaKeys.publicKey,
          rsaKeys.privateKey
        ])

        var formdata = {
          "username": formData.username,
          "publicKey": btoa(rsaKeys.publicKey)
        }

        var requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formdata),
        };

        registrationStateMessage("Send public key and username")
        await fetch(
          'http://' + formData.ip + ':' + formData.port + '/register',
          requestOptions
        ).then(async (res) => {
            if(res.ok) {
              let username: string = await res.text()

              putUsername(username)
              putIp(formData.ip)
              putPort(formData.port)
              putPrivateKey(rsaKeys.privateKey)

              chatReady()
              // Enregistrer user, username private Key 
            }
        })
      })()
    }

  }, [canSend])

  return (
    <form id="registerForm" onSubmit={handleSubmit}>
      <Input
        type="text"
        name="ip"
        placeholder="ip"
        value={formData.ip}
        onChange={handleChange}
      />
      <Input
        type="text"
        name="port"
        placeholder="port"
        value={formData.port}
        onChange={handleChange}
      />
      <Input
        type="text"
        name="username"
        placeholder="username"
        value={formData.username}
        onChange={handleChange}
      />

      <Input type="submit" value={"Register"} />
    </form>
  )
}
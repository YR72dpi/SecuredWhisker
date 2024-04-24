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
    ip: '127.0.0.1',
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

        const generateBrowserID = () => {
          const screenWidth     = screen.width;
          const screenHeight    = screen.height;
          const appName         = navigator.appName;
          const platform        = navigator.platform;
          const language        = navigator.language;
          const userAgent       = navigator.userAgent;
          const languages       = navigator.languages.join("")
          const timezoneOffset  = new Date().getTimezoneOffset();
          const cookiesEnabled  = navigator.cookieEnabled ? 'CookiesEnabled' : 'CookiesDisabled';
          const plugins         = Array.from(navigator.plugins, plugin => plugin.name).join(',');
          
          // Concatenate all information into a single string
          const combinedString = 
          userAgent + platform + appName + 
          language + plugins + timezoneOffset + 
          screenWidth + screenHeight + cookiesEnabled 
          + languages;
          
          // Take a simple hash of the combined string
          let hash = 0;
          for (let i = 0; i < combinedString.length; i++) {
            const char = combinedString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32-bit integer
          }
          
          return hash.toString(36); // Convert to base36 to make it more readable
        }

        registrationStateMessage("Generate RSA keys")
        const rsaKeys = await generateRSAKeys()

        console.table([
          rsaKeys.publicKey,
          rsaKeys.privateKey
        ])

        var formdata = {
          "username": formData.username,
          "publicKey": btoa(rsaKeys.publicKey),
          "browserId": generateBrowserID()
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
    <form id="registerForm" method="post" onSubmit={handleSubmit}>
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
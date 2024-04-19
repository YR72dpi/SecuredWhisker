"use client"
import { Contact } from "@/components/Contact";
import { RegisterForm } from "@/components/RegisterForm";
import { SendMessageForm } from "@/components/SendMessageForm";
import { ShowMessage } from "@/components/showMessage";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@radix-ui/react-separator";

import { useEffect, useState } from "react";

export default function Home() {

  const [formSubmitted, setFormSubmitted] = useState(false)
  const [registrationState, setRegistrationState] = useState("")
  const [isChatReady, setChatReady] = useState(false)

  const [username, setUsername] = useState("")
  const [ip, setIp] = useState("")
  const [port, setPort] = useState("")
  const [privateKey, setPrivateKey] = useState("")

  const handleSubmittedForm = () => { setFormSubmitted(true) }
  const handleRegistrationState = (state: string) => { setRegistrationState(state) }
  const handleChatReady = () => { setChatReady(true) }

  const handleGetUsername = (gotUsername: string) => { setUsername(gotUsername) }
  const handleGetIp = (gotIp: string) => { setIp(gotIp) }
  const handleGetPort = (gotPort: string) => { setPort(gotPort) }
  const handleGetPrivateKey = (gotPrivateKey: string) => { setPrivateKey(gotPrivateKey) }

  const [selectedUser, setSelectedUser] = useState("")
  const handleUserSelected = (userSelected: string) => {
    setSelectedUser(userSelected)
  }

  const [messages, setMessages] = useState(JSON.stringify([]))
  useEffect(() => {
    if (isChatReady) {
      (async () => {
        setInterval(async () => {
          const fetchMessage: string | undefined = await fetch("http://" + ip + ":" + port + "/myMessage?name=" + username)
            .then(async (res) => {
              if (res.ok) {
                let result: string = await res.text()
                return result
              }
            })

          if (fetchMessage !== undefined) {
            setMessages(fetchMessage)
          }

        }, 1000)
      })()
    }
  }, [isChatReady, messages, selectedUser])

  return (
    <>
      <main>
        {!isChatReady ? (
          <RegisterForm
            formSubmitted={handleSubmittedForm}
            registrationStateMessage={handleRegistrationState}
            chatReady={handleChatReady}

            putUsername={handleGetUsername}
            putIp={handleGetIp}
            putPort={handleGetPort}
            putPrivateKey={handleGetPrivateKey}
          />
        ) : (<></>)}

        {(formSubmitted && !isChatReady) ? (
          <p>{registrationState}</p>
        ) : (<></>)}

        {isChatReady ? (
          <>
            {username !== "" ? (<p><strong>Your username : </strong>{username}</p>) : (<></>)}
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-[85vh] max-h-[85vh] max-w-[100vw] rounded-lg border"
            >
              <ResizablePanel defaultSize={25}>
                <Contact messages={messages} you={username} userSelected={handleUserSelected} />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={75}>
                
                { selectedUser !== "" ? (
                  <ShowMessage from={selectedUser} messages={messages} you={username} />
                ) : (<></>)}
              </ResizablePanel>
            </ResizablePanelGroup>

            <SendMessageForm ip={ip} port={port} username={username} toUser={selectedUser} />
          </>
        ) : (<></>)
        }

      </main>
    </>
  );
}

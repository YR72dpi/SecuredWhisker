"use client"
import { useEffect, useState }                                  from "react"
import { Contact }                                              from "@/components/Contact"
import { ShowMessage }                                          from "@/components/showMessage"
import { RegisterForm }                                         from "@/components/RegisterForm"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { SendMessageForm }                                      from "@/components/SendMessageForm"

export default function Home() {

  const [ip, setIp]                               = useState("")
  const [port, setPort]                           = useState("")
  const [username, setUsername]                   = useState("")
  const [messages, setMessages]                   = useState(JSON.stringify([]))
  const [isChatReady, setChatReady]               = useState(false)
  const [privateKey, setPrivateKey]               = useState("")
  const [selectedUser, setSelectedUser]           = useState("")
  const [formSubmitted, setFormSubmitted]         = useState(false)
  const [registrationState, setRegistrationState] = useState("")

  const handleGetIp             = (gotIp: string)         => { setIp(gotIp) }
  const handleGetPort           = (gotPort: string)       => { setPort(gotPort) }
  const handleChatReady         = ()                      => { setChatReady(true) }
  const handleGetUsername       = (gotUsername: string)   => { setUsername(gotUsername) }
  const handleUserSelected      = (userSelected: string)  => { setSelectedUser(userSelected) }
  const handleSubmittedForm     = ()                      => { setFormSubmitted(true) }
  const handleGetPrivateKey     = (gotPrivateKey: string) => { setPrivateKey(gotPrivateKey) }
  const handleRegistrationState = (state: string)         => { setRegistrationState(state) }

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
        {!isChatReady &&
          <RegisterForm
            formSubmitted={handleSubmittedForm}
            registrationStateMessage={handleRegistrationState}
            chatReady={handleChatReady}

            putUsername={handleGetUsername}
            putIp={handleGetIp}
            putPort={handleGetPort}
            putPrivateKey={handleGetPrivateKey}
          />
        }

        {(formSubmitted && !isChatReady) && <p>{registrationState}</p>}

        {isChatReady &&
          <>
            {username !== "" && <p><strong>Your username : </strong>{username}</p>}
            <ResizablePanelGroup direction="horizontal" className="min-h-[85vh] max-h-[85vh] max-w-[100vw] rounded-lg border">
              <ResizablePanel defaultSize={25}>
                <Contact messages={messages} you={username} userSelected={handleUserSelected} />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={75}>
                { selectedUser !== "" && <ShowMessage messages={messages} you={username} privateKey={privateKey} selectedUser={selectedUser} />}
              </ResizablePanel>
            </ResizablePanelGroup>
            <SendMessageForm ip={ip} port={port} username={username} userSelected={selectedUser} />
          </>
        }
      </main>
    </>
  );
}

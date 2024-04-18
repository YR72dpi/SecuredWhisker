"use client"
import { RegisterForm } from "@/components/RegisterForm";
import { SendMessageForm } from "@/components/SendMessageForm";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@radix-ui/react-separator";

import { useState } from "react";

export default function Home() {

  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isChatReady, setChatReady] = useState(false)

  const handleSubmittedForm = () => { setFormSubmitted(true) }
  const handleChatReady = () => { setChatReady(true) }

  return (
    <>
      <main>
        {!isChatReady ? (
          <RegisterForm
            formSubmitted={handleSubmittedForm}
            chatReady={handleChatReady}
          />
        ) : (<></>)}

        { (formSubmitted && !isChatReady) ? (
          <p>Registration...</p>
        ) : (<></>) }
        
        {isChatReady ? (
            <>
            <p><strong>Your username : </strong>Bottom</p>
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-[85vh] max-h-[85vh] max-w-[100vw] rounded-lg border"
            >
              <ResizablePanel defaultSize={25}>
                <ScrollArea className="h-[100%] w-[100%] rounded-md border p-4">
                  <ul className="p-1 flex flex-col gap-2 overflow-auto" >
                    <li className="px-2 py-1 rounded-lg border hover:bg-slate-600">Oui</li>
                  </ul>
                </ScrollArea>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={75}>
                <ScrollArea className="h-[100%] w-[100%] rounded-md border p-4">
                  <p><strong>Pseudo : </strong>Bottom</p>
                  <hr />



                </ScrollArea>
              </ResizablePanel>
            </ResizablePanelGroup>

            <SendMessageForm />
          </>
        ) : (<></>)
      }

      </main>
    </>
  );
}

"use client"
import { AddFriend } from "@/components/addFriend";
import { Chat } from "@/components/chat";
import { ContactList } from "@/components/contactList";
import { ContactRequest } from "@/components/contactRequest";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { SwDb } from "@/lib/SwDatabase";
import { useEffect, useState } from "react";

export default function Home() {
    const [identifier, setIdentifier] = useState<string | null>(null)
    const [username, setUsername] = useState<string | null>(null)

    useEffect(() => {

        const identifier = async () => {

            const jwtToken = await SwDb.getJwtToken()
            console.log(jwtToken)

            const myHeaders = new Headers();
            myHeaders.append("Authorization", "Bearer " + jwtToken);

            const requestOptions: RequestInit = {
                method: "GET",
                headers: myHeaders,
                redirect: "follow"
            };

            return fetch("http://localhost:4000/api/protected/selfUserData", requestOptions)
                .then((response) => response.json())
                .then((result) => {
                    setIdentifier(result.identifier)
                    setUsername(result.username)
                })
                .catch((error) => console.error(error));
        }

        identifier()
    }, [])

    return (
        <>
            <div className="p-14 block h-screen">
                <span>Your identifier : {identifier ?? "Loading your identifier..."}</span>
                <ResizablePanelGroup
                    direction="horizontal"
                    className="h-full rounded-lg border w-[100vh]"
                >
                    <ResizablePanel defaultSize={25}>
                        <div className="flex flex-col gap-1 p-6">
                            {identifier && (
                                <>
                                <AddFriend />
                                <ContactRequest />
                                <ContactList />
                                </>
                            )}
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={75}>
                        <div className="flex h-full items-center justify-center">

                            <ResizablePanelGroup
                                direction="vertical"
                                className="h-full w-[100vh]"
                            >
                                <ResizablePanel defaultSize={75}>
                                    <div className="flex h-full">
                                        <ResizablePanelGroup
                                            direction="vertical"
                                            className="h-full w-full"
                                        >
                                            <ResizablePanel defaultSize={100}>
                                                <div className="h-full">
                                                    {username && (
                                                        <>
                                                        <Chat username={username} />
                                                        </>
                                                    )}
                                                </div>
                                            </ResizablePanel>
                                        </ResizablePanelGroup>
                                    </div>
                                </ResizablePanel>
                                {/* <ResizableHandle withHandle />
                                <ResizablePanel defaultSize={10}>
                                    <div className="flex h-full items-center justify-center p-6">
                                        <span className="font-semibold">input</span>
                                    </div>
                                </ResizablePanel> */}
                            </ResizablePanelGroup>

                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </>
    );
}

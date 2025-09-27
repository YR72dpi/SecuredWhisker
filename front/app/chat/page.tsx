"use client"
import { AddFriend } from "@/components/addFriend";
import { Chat, ContactDataForChat } from "@/components/chat";
import { ContactList } from "@/components/contactList";
import { ContactRequest } from "@/components/contactRequest";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { CopyButton } from "@/components/ui/shadcn-io/copy-button";
import { SwDb } from "@/lib/SwDatabase";
import { useEffect, useState } from "react";

function getApiProtocol() {
    return process.env.NODE_ENV === "development" ? "http" : "https";
}

export default function Home() {
    const [identifier, setIdentifier] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [username, setUsername] = useState<string | null>(null)

    const [selectedContact, setSelectedContact] = useState<ContactDataForChat | null>(null);
    const [contactsRefreshKey, setContactsRefreshKey] = useState(0)

    useEffect(() => {

        (async () => {

            const jwtToken = await SwDb.getJwtToken()

            const myHeaders = new Headers();
            myHeaders.append("Authorization", "Bearer " + jwtToken);

            const requestOptions: RequestInit = {
                method: "GET",
                headers: myHeaders,
                redirect: "follow"
            };

            return fetch(getApiProtocol() + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfUserData", requestOptions)
                .then((response) => response.json())
                .then((result) => {
                    setIdentifier(result.identifier)
                    setUsername(result.username)
                    setUserId(result.id)
                })
                .catch((error) => console.error(error));
        })()

    }, [])

    return (
        <>
            <div className="p-3 block h-[90vh]">
                <div className="flex gap-2 text-base p-1">
                    <span>
                        {identifier ? "Your identifier : " + identifier : "Loading your identifier..."}
                    </span>
                    {identifier && (
                        <CopyButton
                            size="sm"
                            variant="outline"
                            content={identifier}
                            onCopy={() => console.log("Link copied!")}
                        />
                    )}
                </div>
                <ResizablePanelGroup
                    direction="horizontal"
                    className="rounded-lg border w-[100vw]"
                >
                    <ResizablePanel defaultSize={25}>
                        <div className="flex flex-col gap-1 p-6">
                            {identifier && (
                                <>
                                    <AddFriend />
                                    <ContactRequest onContactAccepted={() => setContactsRefreshKey(k => k + 1)} />
                                    <ContactList
                                        onSelectContact={setSelectedContact}
                                        refreshKey={contactsRefreshKey}
                                    />
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
                                                    {username && selectedContact && userId && (
                                                        <Chat
                                                            username={username}
                                                            userId={userId}
                                                            contactData={selectedContact}
                                                        />
                                                    )}
                                                </div>
                                            </ResizablePanel>
                                        </ResizablePanelGroup>
                                    </div>
                                </ResizablePanel>
                            </ResizablePanelGroup>

                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </>
    );
}


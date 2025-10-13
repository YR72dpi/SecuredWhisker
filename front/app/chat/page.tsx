"use client"
import { Chat, ContactDataForChat } from "@/components/chat";
import { ContactList } from "@/components/Friendship/contactList";
import { SwDb } from "@/lib/SwDatabase";
import { useEffect, useRef, useState } from "react";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { JwtTokenLib } from "@/lib/JwtTokenLib";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar";

export default function Home() {
    const [canShowPage, setCanShowPage] = useState(false)

    const [identifier, setIdentifier] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [username, setUsername] = useState<string | null>(null)
    const [publicKey, setPublicKey] = useState<string | null>(null)
    const hasPrivateKey = useRef<boolean>(false)

    const [selectedContact, setSelectedContact] = useState<ContactDataForChat | null>(null);

    useEffect(() => {

        (async () => {

            const jwtToken = await JwtTokenLib.isValidJwtToken()
            if (process.env.NODE_ENV === "development") console.log("JWT Token: " + jwtToken)
            if (!jwtToken) window.location.replace("/");

            const privateKeyInterface = await SwDb.getPrivateKey()
            hasPrivateKey.current = privateKeyInterface ? true : false

            const myHeaders = new Headers();
            myHeaders.append("Authorization", "Bearer " + jwtToken);

            const requestOptions: RequestInit = {
                method: "GET",
                headers: myHeaders,
                redirect: "follow"
            };

            return fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfUserData", requestOptions)
                .then((response) => response.json())
                .then((result) => {
                    setIdentifier(result.identifier)
                    setUsername(result.username)
                    setUserId(result.id)
                    setPublicKey(result.publicKey)
                    setCanShowPage(true)

                })
                .catch((error) => console.error(error));
        })()
    }, [])

    return (

        canShowPage ? (
            <SidebarProvider>
                <AppSidebar
                    username={username}
                    identifier={identifier}
                    publicKey={publicKey}
                />
                <main className="w-full border p-3">
                    <SidebarTrigger />

                    {!hasPrivateKey.current && (
                        <Alert variant="destructive">
                            <AlertCircleIcon />
                            <AlertTitle className="font-bold">No private key here 😥</AlertTitle>
                            <AlertDescription>
                                <p>To decode your message, you need to have your private key on this browser</p>
                                <ul className="list-inside list-disc text-sm">
                                    <li>
                                        On the browser where you subscribe: Menu bar {">"} Security {">"} Private key transfert (tx)
                                    </li>
                                    <li>
                                        On the this browser: Menu bar {">"} Security {">"} Private key transfert (rx)
                                    </li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    {hasPrivateKey.current && identifier && !selectedContact && (
                        <>
                            <ContactList
                                onSelectContact={setSelectedContact}
                            />
                        </>
                    )}
                    
                    {publicKey && hasPrivateKey.current && username && selectedContact && userId && (
                        <Chat
                            username={username}
                            userId={userId}
                            userPublicKey={publicKey}
                            contactData={selectedContact}
                            setContactData={setSelectedContact}
                        />
                    )}
                </main>
            </SidebarProvider>
        ) : null

    );
}


"use client"
import { Chat, ContactDataForChat } from "@/components/chat";
import { ContactList } from "@/components/contactList";
import { SwDb } from "@/lib/SwDatabase";
import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppMenu } from "@/components/AppMenu";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";

function useWindowWidth() {
    const [windowWidth, setWindowWidth] = useState<number | undefined>(undefined);

    useEffect(() => {
        const width = window.innerWidth as number | undefined
        const handleResize = () => setWindowWidth(width);

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowWidth;
}

export default function Home() {
    const [canShowPage, setCanShowPage] = useState(false)

    const [identifier, setIdentifier] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [username, setUsername] = useState<string | null>(null)
    const [publicKey, setPublicKey] = useState<string | null>(null)
    const hasPrivateKey = useRef<boolean>(false)

    const [selectedContact, setSelectedContact] = useState<ContactDataForChat | null>(null);
    const [contactsRefreshKey, setContactsRefreshKey] = useState(0)

    const width = useWindowWidth();

    useEffect(() => {

        (async () => {

            const jwtToken = await SwDb.getJwtToken()
            if (!jwtToken) {
                window.location.replace("/login");
                return;
            }

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
                .then((response) => {
                    if (!response.ok) {
                        window.location.replace("/login");
                        return;
                    }
                    return response.json();
                })
                .then((result) => {
                    if (!result?.identifier) {
                        window.location.replace("/login");
                        return;
                    }
                    setIdentifier(result.identifier)
                    setUsername(result.username)
                    setUserId(result.id)
                    setPublicKey(result.publicKey)
                    setCanShowPage(true)

                })
                .catch((error) => {
                    console.error(error);
                    window.location.replace("/login");
                });
        })()
    }, [])

    return (

        canShowPage && (
            <div className="p-3 flex flex-col gap-3" >

                {(width && width >= 400) ? (
                    <>
                        <AppMenu
                            identifier={identifier}
                            publicKey={publicKey}
                            onContactAccepted={() => setContactsRefreshKey(k => k + 1)}
                            width={width}
                        />

                        {hasPrivateKey.current && identifier && !selectedContact && (
                            <>
                                <ContactList
                                    onSelectContact={setSelectedContact}
                                    refreshKey={contactsRefreshKey}
                                    width={width}
                                />
                            </>
                        )}

                        {hasPrivateKey.current && username && selectedContact && userId && (
                            <Chat
                                username={username}
                                userId={userId}
                                contactData={selectedContact}
                                setContactData={setSelectedContact}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <Tabs defaultValue="chat">
                            <TabsList>
                                <TabsTrigger value="menu">Menu</TabsTrigger>
                                <TabsTrigger value="chat">Chat</TabsTrigger>
                            </TabsList>

                            <TabsContent value="menu">
                                <AppMenu
                                    identifier={identifier}
                                    publicKey={publicKey}
                                    onContactAccepted={() => setContactsRefreshKey(k => k + 1)}
                                    width={width}
                                />
                            </TabsContent>
                            <TabsContent value="chat">

                                {hasPrivateKey.current && identifier && !selectedContact && (
                                    <>
                                        <ContactList
                                            onSelectContact={setSelectedContact}
                                            refreshKey={contactsRefreshKey}
                                            width={width}
                                        />
                                    </>
                                )}

                                {hasPrivateKey.current && username && selectedContact && userId && (
                                    <Chat
                                        username={username}
                                        userId={userId}
                                        contactData={selectedContact}
                                        setContactData={setSelectedContact}
                                    />
                                )}

                            </TabsContent>
                        </Tabs>
                    </>

                )}

                {
                    !hasPrivateKey.current && (

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
                    )
                }

            </div >
        )



    );
}


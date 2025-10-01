"use client"
import { Chat, ContactDataForChat } from "@/components/chat";
import { ContactList } from "@/components/contactList";
import { SwDb } from "@/lib/SwDatabase";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppMenu } from "@/components/AppMenu";

function getApiProtocol() {
    return process.env.NODE_ENV === "development" ? "http" : "https";
}

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
    const [identifier, setIdentifier] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [username, setUsername] = useState<string | null>(null)
    const [publicKey, setPublicKey] = useState<string | null>(null)

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

            const myHeaders = new Headers();
            myHeaders.append("Authorization", "Bearer " + jwtToken);

            const requestOptions: RequestInit = {
                method: "GET",
                headers: myHeaders,
                redirect: "follow"
            };

            return fetch(getApiProtocol() + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfUserData", requestOptions)
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
                })
                .catch((error) => {
                    console.error(error);
                    window.location.replace("/login");
                });
        })()

    }, [])

    return (
        <>
            <div className="p-3 flex flex-col gap-3">

                {(width === undefined || width < 400) ? (
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

                                {identifier && !selectedContact && (
                                    <>
                                        <ContactList
                                            onSelectContact={setSelectedContact}
                                            refreshKey={contactsRefreshKey}
                                            width={width}
                                        />
                                    </>
                                )}

                                {username && selectedContact && userId && (
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
                ) : (
                    <>
                        <AppMenu
                            identifier={identifier}
                            publicKey={publicKey}
                            onContactAccepted={() => setContactsRefreshKey(k => k + 1)}
                            width={width}
                        />

                        {identifier && !selectedContact && (
                            <>
                                <ContactList
                                    onSelectContact={setSelectedContact}
                                    refreshKey={contactsRefreshKey}
                                    width={width}
                                />
                            </>
                        )}

                        {username && selectedContact && userId && (
                            <Chat
                                username={username}
                                userId={userId}
                                contactData={selectedContact}
                                setContactData={setSelectedContact}
                            />
                        )}
                    </>
                )}


            </div>

        </>
    );
}


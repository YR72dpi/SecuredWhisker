"use client"
import { Chat } from "@/components/chat";
import { ContactList } from "@/components/Friendship/contactList";
import { SwDb } from "@/lib/SwDatabase";
import { useEffect, useRef, useState } from "react";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { JwtTokenLib } from "@/lib/JwtTokenLib";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar";
import { PushNotificationManager } from "@/components/Notification/PushNotificationManager";
import { InstallPrompt } from "@/components/Notification/InstallPrompt";
import { deleteBrowserSubscriptionIfNotFindOnDb, isPushNotificationSupported } from "@/lib/Notification";
import { toast } from "sonner";
import { ReceiverDataForChat, SenderDataForChat } from "@/lib/ChatLib";
import { isVapIdOk } from "@/lib/ServerAction/NotificationActions";
import { RSAPrivateKeyReceiver } from "@/components/RSAPrivateKeyTransfertComponent/RSAPrivateKeyReceiver";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
    const [canShowPage, setCanShowPage] = useState(false)

    const [identifier, setIdentifier] = useState<string | null>(null)
    const hasPrivateKey = useRef<boolean>(false)

    const [senderData, setSenderData] = useState<SenderDataForChat>(); // you
    const [selectedContact, setSelectedContact] = useState<ReceiverDataForChat | null>(null); // the choosen friend

    const [hasVapId, setHasVapId] = useState<boolean|null>(null)

    useEffect(() => {

        (async () => {
            setHasVapId(await isVapIdOk())
            const jwtToken = await JwtTokenLib.isValidJwtToken()
            if (process.env.NODE_ENV === "development") console.log("JWT Token: " + jwtToken)
            if (jwtToken === null) { window.location.replace("/"); return; }

            const privateKeyInterface = await SwDb.getPrivateKey()
            hasPrivateKey.current = privateKeyInterface ? true : false

            const myHeaders = new Headers();
            myHeaders.append("Authorization", "Bearer " + jwtToken);

            const requestOptions: RequestInit = {
                method: "GET",
                headers: myHeaders,
                redirect: "follow"
            };

            await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfUserData", requestOptions)
                .then((response) => response.json())
                .then((result) => {
                    setIdentifier(result.identifier)
                    setSenderData({
                        id: result.id,
                        username: result.username,
                        publicKey: result.publicKey
                    });

                    setCanShowPage(true)
                })
                .catch((error) => console.error(error));

            if(hasVapId) {
                const isThisBrowserSubscriptionDeletedOnBase = await deleteBrowserSubscriptionIfNotFindOnDb(jwtToken as string)
                if (isThisBrowserSubscriptionDeletedOnBase) toast.info(
                    "The registration for push notifications for this browser was not found in the database and has been deleted.",
                    { duration: 5000 }
                )
            }
            
            return;
        })()
    }, [])

    return (
        canShowPage && senderData ? (
            <SidebarProvider>
                <AppSidebar
                    username={senderData.username}
                    identifier={identifier}
                    publicKey={senderData.publicKey}
                    hasVapId={hasVapId}
                />
                <main className="w-full border p-3 flex flex-col gap-3">
                    <SidebarTrigger />

                    {hasVapId && isPushNotificationSupported() && !selectedContact && (<PushNotificationManager />)}
                    <InstallPrompt />

                    {!hasPrivateKey.current && (
                        <>
                            <Alert variant="destructive">
                                <AlertCircleIcon />
                                <AlertTitle className="font-bold">No private key here 😥</AlertTitle>
                                <AlertDescription>
                                    <p>To decode your messages, your private key must be available on this browser. You have two options to recover it:</p>
                                    <ul className="list-inside list-disc text-sm mt-1">
                                        <li><strong>Key transfer</strong> — transfer your key from another browser where you already have it.</li>
                                        <li><strong>Keybox</strong> — retrieve your key from the encrypted keybox you previously saved.</li>
                                    </ul>
                                </AlertDescription>
                            </Alert>
                            <div className="flex gap-3">
                                <RSAPrivateKeyReceiver standalone />
                                <Button className="flex-1" asChild>
                                    <Link href="/keybox">Keybox</Link>
                                </Button>
                            </div>
                        </>
                    )}

                    {hasPrivateKey.current && identifier && !selectedContact && (
                        <>
                            <ContactList
                                onSelectContact={setSelectedContact}
                            />
                        </>
                    )}

                    {hasPrivateKey.current
                        && senderData
                        && selectedContact
                        && (
                            <Chat
                                senderDataForChat={senderData}
                                receiverDataForChat={selectedContact}
                                setContactData={setSelectedContact}
                            />
                        )}
                </main>
            </SidebarProvider>
        ) : null

    );
}


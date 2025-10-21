"use client"
import { SwDb } from "@/lib/SwDatabase";
import { useEffect, useRef, useState } from "react";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, ChevronLeftIcon } from "lucide-react";
import { JwtTokenLib } from "@/lib/JwtTokenLib";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button";
import Link from "next/link";
import * as NotificationActions from '../../components/Notification/NotificationActions'

type NotificationSubscriptionResponse = {
    getId: number
    getDeviceName: string
    getSubscription: string
}

export default function Home() {
    const [canShowPage, setCanShowPage] = useState(false)

    const hasPrivateKey = useRef<boolean>(false)
    const [selfNotificationDataPayload, setSelfNotificationDataPayload] = useState<NotificationSubscriptionResponse[]>([])

    const [subscriptionToDelete, setSubscriptionToDelete] = useState<NotificationSubscriptionResponse | null>(null)
    const [jwtTokenForDelete, setJwtTokenForDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState<boolean>(false)

    const getSubscription = async (): Promise<globalThis.PushSubscription | null> => {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
        })
        const sub = await registration.pushManager.getSubscription() as globalThis.PushSubscription | null
        return sub
    }

    useEffect(() => {

        (async () => {

            const jwtToken = await JwtTokenLib.isValidJwtToken()
            if (process.env.NODE_ENV === "development") console.log("JWT Token: " + jwtToken)
            if (!jwtToken) window.location.replace("/");
            if (typeof jwtToken === "string") setJwtTokenForDelete(jwtToken)

            const privateKeyInterface = await SwDb.getPrivateKey()
            hasPrivateKey.current = privateKeyInterface ? true : false

            const myHeaders = new Headers();
            myHeaders.append("Authorization", "Bearer " + jwtToken);

            const requestOptions: RequestInit = {
                method: "GET",
                headers: myHeaders,
                redirect: "follow"
            };

            await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfNotificationSubscription", requestOptions)
                .then((response) => response.json())
                .then((result) => {
                    const data = result.data as NotificationSubscriptionResponse[]
                    setSelfNotificationDataPayload(data)
                    setCanShowPage(true)
                })
                .catch((error) => console.error(error));
        })()
    }, [selfNotificationDataPayload])

    const confirmBeforeDelete = async (subscriptionId: NotificationSubscriptionResponse) => {
        setSubscriptionToDelete(subscriptionId)
    }

    const deleteSubscription = async (subscriptionToDelete: string) => {
        setIsDeleting(true)
        const subscriptonDecode = JSON.parse(atob(subscriptionToDelete)) as PushSubscription
        const thisBrowserSubscription = await getSubscription()

        if(
            thisBrowserSubscription &&
            subscriptonDecode.endpoint === thisBrowserSubscription.endpoint
        ) {
          await thisBrowserSubscription.unsubscribe()
        }


        if (jwtTokenForDelete !== null) await NotificationActions.unsubscribeUser(subscriptonDecode, jwtTokenForDelete)
        setSubscriptionToDelete(null)
        setIsDeleting(false)
    }

    return (
        canShowPage ? (
            <SidebarProvider>

                <main className="w-full border p-3 flex flex-col gap-3">
                    <Link href={"/chat"} prefetch={true} >
                        <Button variant="secondary" size="icon" className="size-8" >
                            <ChevronLeftIcon />
                        </Button>
                    </Link>
                    <>

                        {subscriptionToDelete && (
                            <Alert variant="default">
                                <AlertCircleIcon />
                                <AlertTitle className="font-bold">Delete the notification subscription for {subscriptionToDelete.getDeviceName}</AlertTitle>
                                <AlertDescription>
                                    <p>Are you sure you want to delete notifications for the device "{subscriptionToDelete.getDeviceName}"?</p>
                                    <div className="p-3 flex gap-3 justify-end">
                                        <Button variant="destructive" onClick={() => deleteSubscription(subscriptionToDelete.getSubscription)}>
                                            {isDeleting ? "Deleting..." : "Yes, delete it !"}
                                        </Button>
                                        <Button variant="secondary" onClick={() => setSubscriptionToDelete(null)} >Nop</Button>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {selfNotificationDataPayload.length > 0 ? (
                            <ul className="w-[50%] w-min-[250px] w-max-[400px] my-0 mx-auto flex flex-col gap-3">
                                {selfNotificationDataPayload.map(payload => (
                                    <li key={payload.getId} className="flex justify-center gap-3 items-center border-b p-3">
                                        <p className="w-[100px]">{payload.getDeviceName}</p>
                                        <Button disabled={!!subscriptionToDelete} onClick={() => confirmBeforeDelete(payload)}>Delete</Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="px-3 text-center">You didn't subscribe on any device ! 🤷‍♂️</p>
                        )}

                    </>

                </main>
            </SidebarProvider>
        ) : null

    );
}


import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { SwDb } from "@/lib/SwDatabase";
import { Badge } from "@/components/ui/badge"
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { SidebarMenuButton } from "../ui/sidebar";

type contactsRequestType = {
    uniqid: string;
    username?: string;
}

export function ContactRequest() {
    const [contactsRequest, setContactsRequest] = useState<contactsRequestType[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const acceptContactRequest = async (uniqid: string) => {
        try {
            const jwtToken = await SwDb.getJwtToken();

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "text/plain");
            myHeaders.append("Authorization", "Bearer " + jwtToken);

            const requestOptions: RequestInit = {
                method: "POST",
                headers: myHeaders,
                body: uniqid,
                redirect: "follow"
            };

            const response = await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/acceptContact", requestOptions);

            if (!response.ok) {
                throw new Error("Failed to accept contact");
            }

            // Retirer le contact accepté de la liste
            setContactsRequest((prev) => prev.filter((contact) => contact.uniqid !== uniqid));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {

        const getContactRequest = async () => {
            const jwtToken = await SwDb.getJwtToken()
            if (!jwtToken) { window.location.replace("/login"); return; }

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Authorization", "Bearer " + jwtToken);

            const requestOptions: RequestInit = {
                method: "GET",
                headers: myHeaders,
                redirect: "follow"
            };

            fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/contactRequest", requestOptions)
                .then((response) => response.json())
                .then((result) => {
                    setContactsRequest(result.data)
                    setIsLoading(false)
                })
                .catch((error) => console.error(error));
        }

        getContactRequest()
        const intervalId = setInterval(() => { getContactRequest() }, 5000)

        return () => clearInterval(intervalId);

    }, [])

    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <SidebarMenuButton
                        onSelect={(e) => e.preventDefault()}
                        className="flex items-center justify-between gap-2"
                    >
                        <span>Contacts Request</span>
                        {contactsRequest.length > 0 && (
                            <Badge variant="destructive" className="ml-auto">
                                {contactsRequest.length}
                            </Badge>
                        )}
                    </SidebarMenuButton>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Contacts Request</DialogTitle>
                        {isLoading ? (<p>Loading....</p>) : ""}
                        {!isLoading && contactsRequest.length === 0 ? (
                            <p>No contact requests</p>
                        ) : (
                            <ul className="mt-2 space-y-2">
                                {contactsRequest.map((contact, index) => (

                                    <li key={index} className="border-b p-2 flex place-content-between items-center">
                                        {contact.username ?? "Unnamed contact"}
                                        {contact.uniqid ? " (" + contact.uniqid + ")" : ""}

                                        <Button
                                            onClick={() => acceptContactRequest(contact.uniqid)}
                                            variant="default"
                                        >Accept</Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    )
}
import { useEffect, useState } from "react";
import { SwDb } from "@/lib/SwDatabase";
import { ContactDataForChat } from "./chat";

type ContactListProps = {
    onSelectContact: (contact: ContactDataForChat) => void;
    refreshKey?: number;
};

type Contact = {
    id: string;
    username: string;
    uniqid: string;
    publicKey: string;
};

function getApiProtocol() {
    return process.env.NODE_ENV === "development" ? "http" : "https";
}

export function ContactList({ onSelectContact, refreshKey }: ContactListProps) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    

    useEffect(() => {
        const getContacts = async () => {
            const jwtToken = await SwDb.getJwtToken()

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Authorization", "Bearer " + jwtToken);
            const requestOptions: RequestInit = {
                method: "GET",
                headers: myHeaders,
                redirect: "follow"
            };

            fetch(getApiProtocol() + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/contacts", requestOptions)
                .then((response) => response.json())
                .then((result) => {
                    setContacts(result.data)
                    setIsLoading(false)
                })
                .catch((error) => {
                    console.error(error)
                    setIsLoading(false);
                    setError("Failed to load contacts. Please try again later.");
                });
        }

        getContacts()
    }, [refreshKey])

    return (
        <>
            {isLoading ? (<p>Loading....</p>) : ""}
            {error !== "" && <p className="text-red-500">{error}</p>}
            {!isLoading && error === "" && (
                contacts.length === 0 ? (
                    <p>No contact</p>
                ) : (
                    <ul className="mt-2 space-y-2">
                        {contacts.map((contact, index) => (
                            <li 
                            key={index} 
                            className="border-b p-2 break-all"
                            onClick={() => {
                                onSelectContact(
                                    {
                                        id: contact.id,
                                        username: contact.username,
                                        publicKey: contact.publicKey
                                    }
                                );
                            }}
                            >
                                {contact.username ?? "Unnamed contact"} 
                                <span className="text-sm text-gray-500 italic"> {contact.uniqid ? " (" + contact.uniqid + ")" : ""}</span>
                            </li>
                        ))}
                    </ul>
                )
            )}
        </>
    )
}
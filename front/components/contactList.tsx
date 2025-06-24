import { useEffect, useState } from "react";
import { SwDb } from "@/lib/SwDatabase";

type ContactListProps = {
    onSelectContact: (contactId: string) => void;
    username: (username: string) => void;
    contactPublicKey: (publicKey: string) => void;
};

type Contact = {
    id: string;
    username: string;
    uniqid: string;
    publicKey: string;
};

export function ContactList({ onSelectContact, username, contactPublicKey }: ContactListProps) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

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

            fetch("http://localhost:4000/api/protected/contacts", requestOptions)
                .then((response) => response.json())
                .then((result) => {
                    setContacts(result.data)
                    setIsLoading(false)
                }
                )
                .catch((error) => console.error(error));
        }

        getContacts()
    }, [])

    return (
        <>

            {isLoading ? (<p>Loading....</p>) : ""}
            {!isLoading && contacts.length === 0 ? (
                <p>No contact</p>
            ) : (
                <ul className="mt-2 space-y-2">
                    {contacts.map((contact, index) => (
                        <li 
                        key={index} 
                        className="border-b p-2 break-all"
                        onClick={() => {
                            onSelectContact(contact.id);
                            username(contact.username);
                            contactPublicKey(contact.publicKey);
                        }}
                        >
                            {contact.username ?? "Unnamed contact"} 
                            <span className="text-sm text-gray-500 italic"> {contact.uniqid ? " (" + contact.uniqid + ")" : ""}</span>
                        </li>
                    ))}
                </ul>
            )}
        </>
    )
}
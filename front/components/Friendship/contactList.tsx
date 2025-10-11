import { useEffect, useState } from "react";
import { SwDb } from "@/lib/SwDatabase";
import { ContactDataForChat } from "../chat";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { Spinner } from "../ui/spinner";

type ContactListProps = {
    onSelectContact: (contact: ContactDataForChat) => void;
    width: number | undefined
};

type Contact = {
    id: string;
    username: string;
    uniqid: string;
    publicKey: string;
};

export function ContactList({ onSelectContact, width }: ContactListProps) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    const classForOverrideForTitle = (width === undefined || width < 400) ? "font-bold" : "font-bold text-xl text-center"
    const classForOverrideForList = (width === undefined || width < 400) ? "" : "text-center"

    useEffect(() => {

        const getContacts = async () => {
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

            fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/contacts", requestOptions)
                .then((response) => response.json())
                .then((result) => {
                    setContacts(result.data)
                    setIsLoading(false)
                })
                .catch((error) => {
                    console.error(error)
                    setIsLoading(false);
                    setError("It appears that the server is unavailable and failed to load contacts. Please try again later.");
                });
        }

        getContacts()
        const intervalId = setInterval(() => { getContacts() }, 5000)

        return () => clearInterval(intervalId);

    }, [])

    return (
        <>
            {error !== "" && <p className="text-red-500">{error}</p>}
            {error === "" && isLoading && (<div className="flex justify-center"><Spinner/></div>) }
            {error === "" && !isLoading && contacts && (
                <>
                    <span className={classForOverrideForTitle}>Contacts ({contacts.length})</span>
                    <ul className="mt-2 space-y-2 flex flex-col items-center gap-2">
                        {contacts.map((contact, index) => (
                            <li
                                key={index}
                                className={"border-b break-all w-[300px] max-w-[90%] h-11 leading-10 " + classForOverrideForList}
                                onClick={() => {
                                    onSelectContact(
                                        {
                                            id: contact.id,
                                            username: contact.username,
                                            uniqid: contact.uniqid,
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
                </>
            )}
        </>






    )
}
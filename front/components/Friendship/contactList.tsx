import { useEffect, useState, useCallback, useRef } from "react";
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
    
    // Cache pour éviter de refaire l'appel si les données n'ont pas changé
    const lastFetchTime = useRef<number>(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    
    const classForOverrideForTitle = (width === undefined || width < 400) ? "font-bold" : "font-bold text-xl text-center"
    const classForOverrideForList = (width === undefined || width < 400) ? "" : "text-center"
    
    const getContacts = useCallback(async () => {
        // Annuler la requête précédente si elle est toujours en cours
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();
        
        try {
            const jwtToken = await SwDb.getJwtToken();
            if (!jwtToken) { 
                window.location.replace("/login"); 
                return; 
            }
            
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            myHeaders.append("Authorization", "Bearer " + jwtToken);
            
            const requestOptions: RequestInit = {
                method: "GET",
                headers: myHeaders,
                redirect: "follow",
                signal: abortControllerRef.current.signal,
                cache: "no-cache"
            };
            
            const response = await fetch(
                API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/contacts", 
                requestOptions
            );
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            
            const newContacts = result.data;
            if (JSON.stringify(contacts) !== JSON.stringify(newContacts)) {
                setContacts(newContacts);
                lastFetchTime.current = Date.now();
            }
            
            setIsLoading(false);
            setError("");
            
        } catch (err: any) {
            // Ignorer les erreurs d'annulation
            if (err.name === 'AbortError') return;
        
            console.error(err);
            setIsLoading(false);
            setError("It appears that the server is unavailable. Unable to load contacts. Please try again later.");
            setTimeout(() => { window.location.href = "/chat" }, 5000)
        }
    }, [contacts]);
    
    useEffect(() => {
        getContacts();
        
        // Polling avec délai progressif en cas d'erreur
        const intervalId = setInterval(() => { 
            getContacts();
        }, 5000);
        
        // Cleanup : annuler les requêtes en cours
        return () => {
            clearInterval(intervalId);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [getContacts]);
    
    // Optimisation : mémoriser le handler de sélection
    const handleSelectContact = useCallback((contact: Contact) => {
        onSelectContact({
            id: contact.id,
            username: contact.username,
            uniqid: contact.uniqid,
            publicKey: contact.publicKey
        });
    }, [onSelectContact]);
    
    return (
        <>
            {error !== "" && <p className="text-red-500">{error}</p>}
            {error === "" && isLoading && (<div className="flex justify-center"><Spinner/></div>) }
            {error === "" && !isLoading && contacts && (
                <>
                    <span className={classForOverrideForTitle}>Contacts ({contacts.length})</span>
                    <ul className="mt-2 space-y-2 flex flex-col items-center gap-2">
                        {contacts.map((contact) => (
                            <li
                                key={contact.id}
                                className={"border-b break-all w-[300px] max-w-[90%] h-11 leading-10 cursor-pointer hover:bg-gray-50 transition-colors " + classForOverrideForList}
                                onClick={() => handleSelectContact(contact)}
                            >
                                {contact.username ?? "Contact sans nom"}
                                <span className="text-sm text-gray-500 italic">
                                    {contact.uniqid ? " (" + contact.uniqid + ")" : ""}
                                </span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </>
    )
}
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod"
import { SwDb } from "@/lib/SwDatabase";

import {
    Alert,
    AlertDescription,
    AlertTitle
} from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { SuiteContext } from "node:test";

export function ContactList() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const acceptContactRequest = async (uniqid: string) => {
        try {
            const jwtToken = await SwDb.getJwtToken();

            const myHeaders = new Headers();
            myHeaders.append("Authorization", "Bearer " + jwtToken);


            const requestOptions: RequestInit = {
                method: "GET",
                headers: myHeaders,
                redirect: "follow"
            };

            fetch("http://localhost:4000/api/protected/contacts", requestOptions)
                .then((response) => response.json())
                .then((result) => {
                    setContacts(result)
                })
                .catch((error) => console.error(error));
        } catch (error) {
            console.error(error);
            setError("Failed to accept contact");
        }
    };

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
                    console.log(result)
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

                        <li key={index} className="border-b p-2 break-all">
                            {contact.username ?? "Unnamed contact"} 
                            <span className="text-sm text-gray-500 italic"> {contact.uniqid ? " (" + contact.uniqid + ")" : ""}</span>
                        </li>
                    ))}
                </ul>
            )}
        </>
    )
}
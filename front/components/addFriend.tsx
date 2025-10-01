import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
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
import { MenubarItem } from "./ui/menubar";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";

const formSchema = z.object({
    userIdentifier: z.string().min(2, {
        message: "Username must be at least 2 characters.",
    })

});

export function AddFriend() {
    const [alert, setAlert] = useState<string>("")
    const [alertTitle, setAlertTitle] = useState<string>("")
    const [alertType, setAlertType] = useState<boolean>(false)
    const [open, setOpen] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            userIdentifier: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {

        const jwtToken = await SwDb.getJwtToken()

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + jwtToken);

        const raw = JSON.stringify({
            "userIdentifier": values.userIdentifier
        });

        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/addFriend", requestOptions)
            .then(async (response) => {
                const jsonResponse = await response.json()
                if (!response.ok) {
                    throw new Error(jsonResponse.message || "Erreur inconnue");
                }
                return jsonResponse
            })
            .then(() => {
                setAlertTitle("Success")
                setAlert("Request send")
                setAlertType(true)
                setOpen(false)
            })
            .catch((error) => {
                console.error(error)
                setAlertTitle("Error")
                setAlert(error.message)
                setAlertType(false)
                setOpen(false)
            });

    }

    useEffect(() => {
        setTimeout(() => {
            setAlert("")
        }, 5000)
    }, [alert])

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <MenubarItem onSelect={(e) => e.preventDefault()}>
                        Add a mate
                    </MenubarItem>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a mate</DialogTitle>
                        <DialogDescription>
                            Enter the identifier of the user you want to add as a friend.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="userIdentifier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="user identifier" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">Submit</Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {alert !== "" && (
                <Alert
                    variant={alertType ? "default" : "destructive"}
                    className="fixed bottom-[15px] left-1/2 -translate-x-1/2 w-[80%] max-w-md bg-[#fff] z-50 shadow-lg"
                >
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{alertTitle}</AlertTitle>
                    <AlertDescription>
                        {alert}
                    </AlertDescription>
                </Alert>
            )}
        </>
    )
}
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

const formSchema = z.object({
    userIdentifier: z.string().min(2, {
        message: "Username must be at least 2 characters.",
    })

});

export function AddFriend() {
    const [alert, setAlert] = useState<string>("")
    const [alertType, setAlertType] = useState<boolean>(false)

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

        fetch(process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/addFriend", requestOptions)
            .then(async (response) => {
                const jsonResponse = await response.json()
                 if (!response.ok) {
                    throw new Error(jsonResponse.message || "Erreur inconnue");
                }
                return jsonResponse
            })
            .then((result) => {
                console.log(result)
                setAlert("Request send")
                setAlertType(true)
            })
            .catch((error) => {
                console.error(error)
                setAlert(error.message)
                setAlertType(false)
            });

    }

    useEffect(() => {
        setTimeout(() => {
            setAlert("")
        }, 5000)
    }, [alert])

    return (
        <>
            <Dialog>
                <DialogTrigger className="border p-2 rounded">Add a mate</DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a mate</DialogTitle>
                        <DialogDescription>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="userIdentifier"
                                        render={({ field }) => (
                                            <FormItem>
                                                {/* <FormLabel>Username</FormLabel> */}
                                                <FormControl>
                                                    <Input placeholder="user identifier" {...field} />
                                                </FormControl>
                                                {/* <FormDescription>
                                       This is your public display name.
                                     </FormDescription> */}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit">Submit</Button>
                                </form>
                            </Form>
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>

            {alert !== "" && (
                <Alert variant={alertType ? "default" : "destructive"} className="fixed bottom-[15px] w-[80%] bg-[#fff] z-10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {alert}
                    </AlertDescription>
                </Alert>
            )
            }
        </>
    )
}
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

import { QrCode } from "lucide-react"
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { QrCodeScanner } from "../qrcode/QrCodeScanner";
import { toast } from "sonner";
import { SidebarMenuButton } from "../ui/sidebar";

const formSchema = z.object({
    userIdentifier: z.string().min(2, {
        message: "Username must be at least 2 characters.",
    })

});

export function AddFriend() {
    const [open, setOpen] = useState(false)
    const [qrcode, setQrCode] = useState<boolean>(false)
    const [wantedFriend, setWantedFriend] = useState<string>("")

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            userIdentifier: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setWantedFriend(values.userIdentifier)
    }

    async function sendRequest() {
        const jwtToken = await SwDb.getJwtToken()

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + jwtToken);

        const raw = JSON.stringify({ "userIdentifier": wantedFriend });

        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/addFriend", requestOptions)
            .then(async (response) => {
                const jsonResponse = await response.json()
                if (!response.ok) {
                    throw new Error(jsonResponse.message || "Erreur inconnue");
                }
                return jsonResponse
            })
            .then(() => {
                toast.success("Request send", { duration: 3000 })
                // setAlertTitle("Success")
                // setAlert("Request send")
                // setAlertType(true)
                setOpen(false)
            })
            .catch((error) => {
                console.error(error)
                // setAlertTitle("Error")
                // setAlert(error.message)
                // setAlertType(false)
                toast.error("Error", {
                    duration: Infinity,
                    closeButton: true,
                    description: "Server return an error: " + error.message
                })
                setOpen(false)
            });
    }

    const handleCancelQrCode = () => { setQrCode(false) }

    useEffect(() => {
        (async () => {
            if (wantedFriend !== "") await sendRequest()
        })()
    }, [wantedFriend])

    useEffect(() => {
        if(open === false) {
            form.reset()
        }
    }, [open])

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <SidebarMenuButton onSelect={(e) => e.preventDefault()}>
                        Add a mate
                    </SidebarMenuButton>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a mate</DialogTitle>
                        <DialogDescription>
                            Enter or scan the identifier of the user you want to add as a friend.
                        </DialogDescription>
                    </DialogHeader>

                    {qrcode ? (
                        <QrCodeScanner
                            dataHandler={setWantedFriend}
                            onCancel={handleCancelQrCode}
                        />
                    ) : (
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
                                <div className="flex justify-between gap-2">
                                    <Button type="button" onClick={() => { setQrCode(true) }}><QrCode /></Button>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit">Submit</Button>
                                    </div>
                                </div>
                            </form>
                        </Form>
                    )}

                </DialogContent>
            </Dialog>
        </>
    )
}
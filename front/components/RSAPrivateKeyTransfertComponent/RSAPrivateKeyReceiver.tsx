import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { SwDb } from "@/lib/SwDatabase";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod"
import { RsaPrivateKeyTransfert } from "@/lib/RsaPrivateKeyTransfert/RsaPrivateKeyTransfert";
import { QrCodeScanner } from "../qrcode/QrCodeScanner";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "../ui/input-otp";

enum TransfertMode {
    QRCODE = 1,
    MANUAL = 2
}

const passwordFormSchema = z.object({
    password: z.string()
});

const manunalIdFormSchema = z.object({
    transfertCode: z.string()
});

export const RSAPrivateKeyReceiver = () => {
    const [open, setOpen] = useState<boolean>(false)

    const [privateKey, setPrivateKey] = useState<string | null>(null)

    const [password, setPassword] = useState<string | null>(null)
    const [transfertCode, setTransfertCode] = useState<string | null>(null)
    const [transfertCodeMode, setTransfertCodeMode] = useState<TransfertMode.QRCODE | TransfertMode.MANUAL | null>()
    const [showQrCode, setShowQrCode] = useState<boolean>(true)

    const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            password: "",
        },
    });

    const transfertCodeForm = useForm<z.infer<typeof manunalIdFormSchema>>({
        resolver: zodResolver(manunalIdFormSchema),
        defaultValues: {
            transfertCode: "",
        },
    });

    const handlePassword = () => {
        const passwordFromForm = passwordForm.watch("password");
        setPassword(passwordFromForm);
    }

    const handleTransfertCode = () => {
        const transfertCodeFromForm = transfertCodeForm.watch("transfertCode");
        setTransfertCode(transfertCodeFromForm);
    }

    const handleCancelQrCode = () => {
        // Démonter le composant QrCode d'abord
        setShowQrCode(false);
        // Puis réinitialiser après un délai
        setTimeout(() => {
            setTransfertCodeMode(null);
            setShowQrCode(true);
        }, 200);
    }

    const fetchCryptedRSAKeyPayload = async (): Promise<{ message: string, privateKeyPayload: string, server_time: string }> => {
        const jwtToken = await SwDb.getJwtToken()
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + jwtToken);
        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify({ transfertCode: transfertCode }),
            redirect: "follow"
        };

        const cryptedRSAKeyPayload = await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/qrcodce/getCryptedPrivateKey", requestOptions)
            .then((response) => response.json())
            .then((result) => {
                return result
            })
            .catch((error) => console.error(error));

        return cryptedRSAKeyPayload
    }

    useEffect(() => {
        (async () => {
            const privateKey = await SwDb.getPrivateKey()
            if (privateKey !== undefined) setPrivateKey(privateKey.privateKey)
        })()
    }, [])

    useEffect(() => {
        if (open === false) {
            setPassword(null)
            setTransfertCodeMode(null)
            setShowQrCode(true)
            passwordForm.reset()
            transfertCodeForm.reset()
        }
    }, [open])

    useEffect(() => {
        (async () => {
            if (password && transfertCode) {

                const cryptedRSAKeyPayloadServerResponse = await fetchCryptedRSAKeyPayload()
                const cryptedRSAKeyPayload = cryptedRSAKeyPayloadServerResponse.privateKeyPayload
                const privateKey = await RsaPrivateKeyTransfert.recoverPayload(cryptedRSAKeyPayload, password)
                await SwDb.addPrivateKey(privateKey)

                setOpen(false)
                document.location.href = document.location.href
            }
        })()

    }, [password, transfertCode])

    return (
        !privateKey && (
            <SidebarMenuItem>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <SidebarMenuButton
                            onSelect={(e) => e.preventDefault()}
                            className="flex items-center justify-between gap-2"
                        >
                            Private key transfer (rx)
                        </SidebarMenuButton>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Private key transfer</DialogTitle>
                        </DialogHeader>

                        {password === null ? (
                            <Form {...passwordForm}>
                                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                    <FormField
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <InputOTP maxLength={8} inputMode="text" pattern="^[a-z]{4}-[0-9]{4}$" {...field} >
                                                        <InputOTPGroup>
                                                            <InputOTPSlot index={0} />
                                                            <InputOTPSlot index={1} />
                                                            <InputOTPSlot index={2} />
                                                            <InputOTPSlot index={3} />
                                                        </InputOTPGroup>
                                                        <InputOTPSeparator />
                                                        <InputOTPGroup>
                                                            <InputOTPSlot index={4} />
                                                            <InputOTPSlot index={5} />
                                                            <InputOTPSlot index={6} />
                                                            <InputOTPSlot index={7} />
                                                        </InputOTPGroup>
                                                    </InputOTP>
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
                                        <Button type="button" onClick={handlePassword}>Submit</Button>
                                    </div>
                                </form>
                            </Form>
                        ) : (
                            transfertCodeMode === null ? (
                                <div className="flex gap-3 justify-center">
                                    <Button variant="outline" onClick={() => setTransfertCodeMode(TransfertMode.QRCODE)}>QRCODE</Button>
                                    <Button variant="outline" onClick={() => setTransfertCodeMode(TransfertMode.MANUAL)}>MANUAL</Button>
                                </div>
                            ) : (
                                transfertCodeMode === TransfertMode.QRCODE ? (
                                    <div className="flex flex-col items-center gap-4">
                                        {showQrCode && (
                                            <QrCodeScanner
                                                dataHandler={setTransfertCode}
                                                onCancel={handleCancelQrCode}
                                            />
                                        )}
                                    </div>
                                ) : transfertCodeMode === TransfertMode.MANUAL ? (
                                    <Form {...transfertCodeForm}>
                                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                            <FormField
                                                name="transfertCode"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input placeholder="Transfert code" {...field} />
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
                                                <Button type="button" onClick={handleTransfertCode}>Submit</Button>
                                            </div>
                                        </form>
                                    </Form>
                                ) : null
                            )
                        )}

                    </DialogContent>
                </Dialog>
            </SidebarMenuItem>
        )
    )
}
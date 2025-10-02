import { useEffect, useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { MenubarItem } from "../ui/menubar"
import { SwDb } from "@/lib/SwDatabase";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { Button } from "../ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod"
import { RsaPrivateKeyTransfert } from "@/lib/RsaPrivateKeyTransfert/RsaPrivateKeyTransfert";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";

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

export const QRCodeReceiver = () => {
    const [open, setOpen] = useState<boolean>(false)

    const [privateKey, setPrivateKey] = useState<string | null>(null)

    const [password, setPassword] = useState<string | null>(null)
    const [transfertCode, setTransfertCode] = useState<string | null>(null)

    const [transfertCodeMode, setTransfertCodeMode] = useState<TransfertMode.QRCODE | TransfertMode.MANUAL | null>()

    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsRef = useRef<IScannerControls | null>(null);

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

    const startQRScanner = async () => {
        if (!videoRef.current) return;

        try {
            const codeReader = new BrowserQRCodeReader();

            const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();

            // Filtrer les caméras virtuelles et préférer les caméras physiques
            const physicalCameras = videoInputDevices.filter(device =>
                !device.label.toLowerCase().includes('obs') &&
                !device.label.toLowerCase().includes('virtual') &&
                !device.label.toLowerCase().includes('snap')
            );

            // Préférer la caméra arrière (environment) ou la dernière caméra physique
            let selectedDeviceId: string | undefined;

            if (physicalCameras.length > 0) {
                // Chercher une caméra arrière
                const backCamera = physicalCameras.find(device =>
                    device.label.toLowerCase().includes('back') ||
                    device.label.toLowerCase().includes('rear') ||
                    device.label.toLowerCase().includes('environment')
                );

                selectedDeviceId = backCamera
                    ? backCamera.deviceId
                    : physicalCameras[physicalCameras.length - 1].deviceId;
            } else if (videoInputDevices.length > 0) {
                selectedDeviceId = videoInputDevices[0].deviceId;
            }

            const controls = await codeReader.decodeFromVideoDevice(
                selectedDeviceId,
                videoRef.current,
                (result, error) => {
                    if (result) {
                        setTransfertCode(result.getText());
                        stopQRScanner();
                    }
                    if (error && !(error.name === 'NotFoundException')) {
                        console.error(error);
                    }
                }
            );

            controlsRef.current = controls;
        } catch (error) {
            console.error("Error starting QR scanner:", error);
            alert("Impossible d'accéder à la caméra. Veuillez vérifier les permissions.");
        }
    };

    const stopQRScanner = () => {
        if (controlsRef.current) {
            controlsRef.current.stop();
            controlsRef.current = null;
        }
    };

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
            // get private key
            const privateKey = await SwDb.getPrivateKey()
            if (privateKey !== undefined) setPrivateKey(privateKey.privateKey)
        })()
    }, [])

    useEffect(() => {
        if (open === false) {
            setPassword(null)
            setTransfertCodeMode(null)
            passwordForm.reset()
            transfertCodeForm.reset()
            stopQRScanner()
        }
    }, [open])

    useEffect(() => {
        if (transfertCodeMode === TransfertMode.QRCODE) {
            startQRScanner();
        } else {
            stopQRScanner();
        }

        return () => {
            stopQRScanner();
        };
    }, [transfertCodeMode]);

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
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <MenubarItem
                        onSelect={(e) => e.preventDefault()}
                        className="flex items-center justify-between gap-2"
                    >
                        Private key transfer (rx)
                    </MenubarItem>
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
                                                <Input type="password" placeholder="Password" {...field} />
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
                                    <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden">
                                        <video
                                            ref={videoRef}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 border-4 border-green-500 opacity-50 m-8"></div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Positionnez le QR code devant la caméra
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            stopQRScanner();
                                            setTransfertCodeMode(null);
                                        }}
                                    >
                                        Annuler
                                    </Button>
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
        )
    )
}
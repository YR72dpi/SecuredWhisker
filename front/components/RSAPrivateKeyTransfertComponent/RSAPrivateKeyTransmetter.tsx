import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { RSAKeyTransmission, StringKeyToCrypt } from "@/lib/RsaPrivateKeyTransfert/TransfertEncryptionManager";
import { SwDb } from "@/lib/SwDatabase";
import QRCode from 'qrcode';
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { Button } from "../ui/button";
import { RsaPrivateKeyTransfert } from "@/lib/RsaPrivateKeyTransfert/RsaPrivateKeyTransfert";
import { CopyButton } from "../ui/shadcn-io/copy-button";
import Image from "next/image"
import { Spinner } from "../ui/spinner";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";

export const RSAPrivateKeyTransmetter = () => {
    const [open, setOpen] = useState<boolean>(false)

    const [privateKey, setPrivateKey] = useState<string | null>(null)

    const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean | null>(null)

    const [qrCodeId, setQrCodeId] = useState<string>("");
    const passwordRef = useRef<StringKeyToCrypt|null>()

    const generateQrCode = async () => {
        (async () => {

            // if no private, it's dead
            if (privateKey !== null) {

                passwordRef.current = RSAKeyTransmission.randomString()

                if (passwordRef.current !== null) {
                    const qrCodeData = await RsaPrivateKeyTransfert.generatePayload(
                        privateKey,
                        passwordRef.current.keyToUseToCrypt
                    )

                    const jwtToken = await SwDb.getJwtToken()
                    const myHeaders = new Headers();
                    myHeaders.append("Content-Type", "application/json");
                    myHeaders.append("Authorization", "Bearer " + jwtToken);
                    const requestOptions: RequestInit = {
                        method: "POST",
                        headers: myHeaders,
                        body: qrCodeData,
                        redirect: "follow"
                    };

                    const qrCodeRsaTransmissionId = await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/qrcodce/qrCodeReceive", requestOptions)
                        .then((response) => response.json())
                        .then((result) => {
                            setQrCodeId(result.qrCodeDataRegistrationID)
                            return result.qrCodeDataRegistrationID
                        })
                        .catch((error) => console.error(error));

                    if (qrCodeRsaTransmissionId !== null) {
                        const dataUrl = await QRCode.toDataURL(qrCodeRsaTransmissionId, {
                            width: 1000,
                            margin: 2,
                            color: {
                                dark: '#000000',
                                light: '#FFFFFF'
                            },
                            errorCorrectionLevel: 'H' // Haute correction d'erreur
                        });

                        setQrCodeUrl(dataUrl)
                    }


                }

            } else { return; }

        })()
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
            setQrCodeUrl("")
            setShowPassword(false)
            passwordRef.current = null
            setQrCodeId("")
        }
    }, [open])



    return (
        privateKey && (
            <SidebarMenuItem>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <SidebarMenuButton
                            onClick={() => generateQrCode()}
                            onSelect={(e) => e.preventDefault()}
                            className="flex items-center justify-between gap-2"
                        >
                            Private key transfer (tx)
                        </SidebarMenuButton>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Private key transfer</DialogTitle>
                        </DialogHeader>

                        {passwordRef.current && qrCodeUrl ? (
                            <>
                                <figure className="flex flex-col gap-5">
                                    <Image
                                        src={qrCodeUrl}
                                        alt="Qr code to scan to transfert private key"
                                        width={300}
                                        height={300}
                                        className="mx-auto border-4 border-gray-200 rounded-lg"
                                    />
                                    <figcaption className="flex gap-3 justify-center">
                                        <span>Transfert code: <strong>{qrCodeId}</strong></span>
                                        <CopyButton
                                            onClick={(e) => e.preventDefault()}
                                            size="sm"
                                            variant="outline"
                                            content={qrCodeId}
                                            onCopy={() => console.log("Transfert code Copied!")}
                                        />
                                    </figcaption>
                                </figure>

                                <div className="flex gap-3 justify-center items-center pr-[20px]">
                                    <Button onClick={() => setShowPassword(showPassword ? false : true)}>
                                        {showPassword ? "Hide" : "Show"} password
                                    </Button>
                                    <CopyButton
                                        onClick={(e) => e.preventDefault()}
                                        size="md"
                                        variant="outline"
                                        content={passwordRef.current?.keyToUseToCrypt}
                                        onCopy={() => console.log("Password Copied!")}
                                    />
                                </div>

                                {passwordRef.current && showPassword && (
                                    <div className="flex gap-3 justify-center">
                                        <strong className="text-center">{passwordRef.current.keyToShow ?? ""}</strong>
                                    </div>
                                )}
                            </>
                        ) : (<div className="flex justify-center"><Spinner /></div>)}

                    </DialogContent>
                </Dialog>
            </SidebarMenuItem>
        )
    )
}
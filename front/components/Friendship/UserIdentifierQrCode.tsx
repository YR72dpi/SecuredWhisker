import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { MenubarItem } from "../ui/menubar";
import { QrCode } from "lucide-react";
import Image from "next/image";
import QRCode from 'qrcode';
import { Spinner } from "../ui/spinner";

export function UserIndentifierQrCode({ userIdentifier }: { userIdentifier: string }) {
    const [qrCodeIdentifier, setQrCodeIdentifier] = useState<string>("");

    useEffect(() => {

        (async () => {
            const qrcode = await QRCode.toDataURL(userIdentifier, {
                width: 1000,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'H' // Haute correction d'erreur
            });
            console.log(qrcode)
            setQrCodeIdentifier(qrcode)

            return;
        })()

        return () => { return; };
    }, [userIdentifier])

    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <MenubarItem
                        onSelect={(e) => e.preventDefault()}
                        className="flex items-center justify-between gap-2"
                    >
                        <Button className="w-full">
                            QR Code <QrCode />
                        </Button>
                    </MenubarItem>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>QR Code</DialogTitle>

                        {qrCodeIdentifier !== "" ? (
                            <figure className="flex flex-col gap-5">
                                <Image
                                    src={qrCodeIdentifier}
                                    alt="Qr code to scan to transfert private key"
                                    width={300}
                                    height={300}
                                    className="mx-auto border-4 border-gray-200 rounded-lg"
                                />
                                <figcaption className="flex gap-3 justify-center">
                                    <span>Identifier: <strong>{userIdentifier}</strong></span>
                                </figcaption>
                            </figure>
                        ) : (<><Spinner /></>)}

                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    )
}
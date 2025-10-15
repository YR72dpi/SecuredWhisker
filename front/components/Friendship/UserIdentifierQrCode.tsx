import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import Image from "next/image";
import QRCode from 'qrcode';
import { Spinner } from "../ui/spinner";
import { SidebarMenuButton } from "../ui/sidebar";
import { CopyButton } from "../ui/shadcn-io/copy-button";

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
            setQrCodeIdentifier(qrcode)

            return;
        })()

        return () => { return; };
    }, [userIdentifier])

    return (
        <>
            <Dialog>
                <DialogTrigger asChild>
                    <SidebarMenuButton
                        onSelect={(e) => e.preventDefault()}
                        className="flex items-center justify-between gap-2"
                    >
                        Identifier <QrCode />
                    </SidebarMenuButton>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Identifier</DialogTitle>

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
                                    <CopyButton
                                        size="sm"
                                        variant="ghost"
                                        content={userIdentifier}
                                        onCopy={() => console.log("Identifier copied!")}
                                    />
                                </figcaption>
                            </figure>
                        ) : (<><Spinner /></>)}

                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </>
    )
}
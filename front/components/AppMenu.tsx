'use client'
import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarTrigger,
} from "@/components/ui/menubar"
import { CopyButton } from "./ui/shadcn-io/copy-button"
import { AddFriend } from "./Friendship/addFriend"
import { ContactRequest } from "./Friendship/contactRequest"
import Link from "next/link"
import { SwDb } from "@/lib/SwDatabase"
import { useEffect, useState } from "react"
import { ThemeToggle } from "./theme-toggle"
import { RSAPrivateKeyTransmetter } from "./RSAPrivateKeyTransfertComponent/RSAPrivateKeyTransmetter"
import { RSAPrivateKeyReceiver } from "./RSAPrivateKeyTransfertComponent/RSAPrivateKeyReceiver"
import { Button } from "./ui/button"

type AppMenuProps = {
    identifier: string | null,
    publicKey: string | null,
    width: number | undefined
}

export const AppMenu = ({
    identifier,
    publicKey,
    width
}: AppMenuProps) => {
    const version = process.env.NEXT_PUBLIC_APP_VERSION
    const [privateKey, setPrivateKey] = useState<string | null>(null)

    useEffect(() => {
        const init = async () => {
            const privateK = await SwDb.getPrivateKey()
            if (privateK) setPrivateKey(privateK.privateKey)
        }
        init()
    }, [])

    const classForOverride = (width === undefined || width < 400) ? "flex flex-col width-[50%] items-start border-none h-[15vh]" : ""

    return (
        <div>
            <Menubar className={ "flex justify-between " + classForOverride}>
                <div className="flex">
                    <MenubarMenu>
                    <MenubarTrigger>Secured Whisker</MenubarTrigger>
                    <MenubarContent>
                        <Link target="_blank" title="Secured Whisker's repository" href="https://github.com/YR72dpi/SecuredWhisker">
                            <MenubarItem>Repository</MenubarItem>
                        </Link>
                        <Link target="_blank" title="Secured Whisker's changelog" href="https://github.com/YR72dpi/SecuredWhisker/blob/main/docs/changelog.md">
                            <MenubarItem>Changelog</MenubarItem>
                        </Link>
                        <MenubarSeparator />
                        <MenubarItem>
                            <span className="text-sm text-gray-500 italic">
                                Version: {version ? version : "Development"}
                            </span>
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>

                <MenubarMenu>
                    <MenubarTrigger>Security</MenubarTrigger>
                    <MenubarContent>

                        {privateKey && (
                            <MenubarItem>
                                <div className="flex gap-2 items-center">
                                    <div>Copy my private key</div>
                                    <CopyButton
                                        onClick={(e) => e.preventDefault()}
                                        size="sm"
                                        variant="outline"
                                        content={atob(privateKey)}
                                        onCopy={() => console.log("Private Key copied!")}
                                    />

                                </div>
                            </MenubarItem>
                        )}
                        <MenubarItem>
                            <div className="flex gap-2 items-center">
                                <div>Copy my public key</div>
                                {publicKey && (
                                    <CopyButton
                                        onClick={(e) => e.preventDefault()}
                                        size="sm"
                                        variant="outline"
                                        content={atob(publicKey)}
                                        onCopy={() => console.log("Private Key copied!")}
                                    />
                                )}
                            </div>
                        </MenubarItem>
                        <MenubarSeparator />

                        <RSAPrivateKeyTransmetter /> 
                        <RSAPrivateKeyReceiver />

                    </MenubarContent>
                </MenubarMenu>

                <MenubarMenu>
                    <MenubarTrigger>Relationship</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>
                            {identifier ? (
                                <div className="flex gap-2 items-center">
                                    <div>
                                        Identifier: <span className="text-sm text-gray-500 italic">{identifier}</span>
                                    </div>
                                    <CopyButton
                                        onClick={(e) => e.preventDefault()}
                                        size="sm"
                                        variant="outline"
                                        content={identifier}
                                        onCopy={() => console.log("Link copied!")}
                                    />
                                </div>
                            ) : "Loading your identifier..."}
                        </MenubarItem>
                        <MenubarSeparator />

                        <AddFriend />
                        <ContactRequest />
                    </MenubarContent>
                </MenubarMenu>

                <ThemeToggle />
                </div>

                <div>
                    <Button
                    variant="outline" 
                    title="Disconnection" 
                    onClick={() => { SwDb.saveJwtToken(""); window.location.replace("/") }}
                    className="mr-[-3px] border-none h-8 rounded-sm"
                    >Disconnection</Button>
                </div>
            </Menubar>
        </div>
    )
}
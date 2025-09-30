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
import { AddFriend } from "./addFriend"
import { ContactRequest } from "./contactRequest"
import Link from "next/link"
import { SwDb } from "@/lib/SwDatabase"
import { useEffect, useState } from "react"

type AppMenuProps = {
    identifier: string | null,
    publicKey: string | null,
    onContactAccepted?: () => void
}

export const AppMenu = ({
    identifier,
    publicKey,
    onContactAccepted
}: AppMenuProps) => {
    const version = process.env.NEXT_PUBLIC_APP_VERSION
    const [privateKey, setPrivateKey] = useState<string|null>(null)

    useEffect(() => {
        const init = async () => {
            const privateK = await SwDb.getPrivateKey()
            if(privateK) setPrivateKey(privateK.privateKey)
        }
        init()
    }, [])

    return (
        <div className="p-3">
            <Menubar>
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
                        <MenubarItem>
                            <div className="flex gap-2 items-center">
                                <div>Copy my private key</div>
                            {privateKey && (
                                    <CopyButton
                                        onClick={(e) => e.preventDefault()}
                                        size="sm"
                                        variant="outline"
                                        content={atob(privateKey)}
                                        onCopy={() => console.log("Private Key copied!")}
                                    />
                                )}
                            </div>
                        </MenubarItem>
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
                        {/* <MenubarItem>Transmet my private to another divices</MenubarItem> */}
                        {/* <MenubarSeparator /> */}
                        {/* <MenubarItem>Change My private key</MenubarItem> */}
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
                        <ContactRequest onContactAccepted={onContactAccepted} />

                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
        </div>
    )
}
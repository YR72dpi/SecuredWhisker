import {
    Menubar,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarTrigger,
} from "@/components/ui/menubar"
import { CopyButton } from "./ui/shadcn-io/copy-button"
import { AddFriend } from "./addFriend"
import { ContactRequest } from "./contactRequest"
import Link from "next/link"

type AppMenuProps = {
    identifier: string | null,
    onContactAccepted?: () => void
}

export const AppMenu = ({
    identifier,
    onContactAccepted
}: AppMenuProps) => {
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
                    </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                    <MenubarTrigger>Security</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>
                            Copy my private key
                            {/* <MenubarShortcut>⌘T</MenubarShortcut> */}
                        </MenubarItem>
                        <MenubarItem>
                            Copy my public key
                            {/* <MenubarShortcut>⌘T</MenubarShortcut> */}
                        </MenubarItem>
                        <MenubarItem>Transmet my private to another divices</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem>Change My private key</MenubarItem>
                    </MenubarContent>
                </MenubarMenu>

                <MenubarMenu>
                    <MenubarTrigger>Relation</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>
                            {identifier ? "Identifier" : "Loading your identifier..."}
                        </MenubarItem>
                        {identifier && (
                            <MenubarItem className="gap-2">
                                <span>{identifier} </span>
                                <CopyButton
                                    size="sm"
                                    variant="outline"
                                    content={identifier}
                                    onCopy={() => console.log("Link copied!")}
                                />
                            </MenubarItem>
                        )}
                        <MenubarSeparator />

                        <AddFriend />
                        <ContactRequest onContactAccepted={onContactAccepted} />

                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
        </div>
    )
}
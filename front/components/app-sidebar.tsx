'use client'
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Shield,
  Key,
  LogOut,
  Github,
  FileText,
  Moon,
  Sun,
  ChevronDown
} from "lucide-react"
import { CopyButton } from "./ui/shadcn-io/copy-button"
import { AddFriend } from "./Friendship/addFriend"
import { ContactRequest } from "./Friendship/contactRequest"
import { SwDb } from "@/lib/SwDatabase"
import { RSAPrivateKeyTransmetter } from "./RSAPrivateKeyTransfertComponent/RSAPrivateKeyTransmetter"
import { RSAPrivateKeyReceiver } from "./RSAPrivateKeyTransfertComponent/RSAPrivateKeyReceiver"
import { UserIndentifierQrCode } from "./Friendship/UserIdentifierQrCode"
import { useTheme } from "next-themes"

type AppSidebarProps = {
  identifier: string | null
  publicKey: string | null
  username: string | null
}

export function AppSidebar({ identifier, publicKey, username }: AppSidebarProps) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION
  const [privateKey, setPrivateKey] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    const init = async () => {
      const privateK = await SwDb.getPrivateKey()
      if (privateK) setPrivateKey(privateK.privateKey)
    }
    init()
  }, [])

  const handleDisconnect = () => {
    SwDb.saveJwtToken("")
    window.location.replace("/")
  }

  return (
    <Sidebar>
      <SidebarHeader className="mt-1">
        <SidebarMenu>
          <SidebarMenuItem>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">Secured Whisker</span>
                      <span className="text-xs text-muted-foreground">
                        {version ? `v${version}` : "Development"}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem>
                  <Link
                    href="https://github.com/YR72dpi/SecuredWhisker"
                    target="_blank"
                    title="Secured Whisker's repository"
                    className="flex items-center gap-2"
                  >
                    <Github className="size-4" />
                    <span>Repository</span>
                  </Link>

                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link
                    href="https://github.com/YR72dpi/SecuredWhisker/blob/main/docs/changelog.md"
                    target="_blank"
                    title="Secured Whisker's changelog"
                    className="flex items-center gap-2"
                  >
                    <FileText className="size-4" />
                    <span>Changelog</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>

        {/* Relationship Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Your account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {username && (
                <div className="px-2 text-lg">
                  {username}
                </div>
              )}
              {identifier ? (
                <SidebarMenuItem>
                  <UserIndentifierQrCode userIdentifier={identifier} />
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem>
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Loading identifier...
                  </div>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Relationship</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>

              <SidebarMenuItem>
                <AddFriend />
              </SidebarMenuItem>

              <SidebarMenuItem>
                <ContactRequest />
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Security Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Security</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {privateKey && (
                <SidebarMenuItem>
                  <div className="flex items-center justify-between px-2 py-1.5 w-full">
                    <div className="flex items-center gap-2 text-sm">
                      <Key className="h-4 w-4" />
                      <span>Private Key</span>
                    </div>
                    <CopyButton
                      size="sm"
                      variant="ghost"
                      content={atob(privateKey)}
                      onCopy={() => console.log("Private Key copied!")}
                    />
                  </div>
                </SidebarMenuItem>
              )}

              {publicKey && (
                <SidebarMenuItem>
                  <div className="flex items-center justify-between px-2 py-1.5 w-full">
                    <div className="flex items-center gap-2 text-sm">
                      <Key className="h-4 w-4" />
                      <span>Public Key</span>
                    </div>
                    <CopyButton
                      size="sm"
                      variant="ghost"
                      content={atob(publicKey)}
                      onCopy={() => console.log("Public Key copied!")}
                    />
                  </div>
                </SidebarMenuItem>
              )}

              <RSAPrivateKeyTransmetter />
              <RSAPrivateKeyReceiver />

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>Theme</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleDisconnect}>
              <LogOut />
              <span>Disconnection</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
'use client'
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { JwtTokenLib } from "@/lib/JwtTokenLib"
import { API_PROTOCOL } from "@/lib/NetworkProtocol"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { isVapIdOk } from "@/lib/ServerAction/NotificationActions"

import { useKeyboxConnection } from "./hooks/useKeyboxConnection"
import { usePairKeybox } from "./hooks/usePairKeybox"
import { PairProgressLog } from "./components/PairProgressLog"
import { PairPasswordDialog } from "./components/PairPasswordDialog"
import { KeyboxDevPanel } from "./components/KeyboxDevPanel"

const unlockFormSchema = z.object({
  password: z.string().min(6, { message: "6 chars minimum" }),
})
type UnlockFormValues = z.infer<typeof unlockFormSchema>

export default function KeyboxPage() {
  const router = useRouter()
  const [canShowPage, setCanShowPage] = useState(false)
  const [identifier, setIdentifier] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [hasVapId, setHasVapId] = useState<boolean | null>(null)

  const [showPairDialog, setShowPairDialog] = useState(false)

  const {
    bleAvailable, scanning, bleDevices, connectingId, deviceData,
    pinCode, setPinCode, pinSending, pinSent,
    isConnected, bleDownloading, isKeyboxInit, setIsKeyboxInit,
    showUnlockDialog, setShowUnlockDialog,
    handleScan, handleConnect, handleDisconnect, handleSendPin, handleUnlock, initBle,
  } = useKeyboxConnection()

  const { pairSteps, isPairing, runPairing } = usePairKeybox(() => setIsKeyboxInit(true))

  const unlockForm = useForm<UnlockFormValues>({
    resolver: zodResolver(unlockFormSchema),
    defaultValues: { password: "" },
  })

  const onUnlockSubmit = async (values: UnlockFormValues) => {
    setShowUnlockDialog(false)
    await handleUnlock(values.password)
  }

  useEffect(() => {
    ;(async () => {
      const jwtToken = await JwtTokenLib.isValidJwtToken()
      if (!jwtToken) { router.replace("/login"); return }

      await initBle()
      setHasVapId(await isVapIdOk())

      const myHeaders = new Headers()
      myHeaders.append("Authorization", "Bearer " + jwtToken)
      await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfUserData", {
        method: "GET", headers: myHeaders, redirect: "follow",
      })
        .then(r => r.json())
        .then(r => { setIdentifier(r.identifier); setUsername(r.username); setPublicKey(r.publicKey) })
        .catch(console.error)

      setCanShowPage(true)
    })()
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!canShowPage) return null

  return (
    <SidebarProvider>
      <AppSidebar username={username} identifier={identifier} publicKey={publicKey} hasVapId={hasVapId} />
      <main className="w-full p-3">
        <SidebarTrigger />
        <div className="flex flex-col pt-12 items-center min-h-screen font-[family-name:var(--font-geist-sans)]">

          {!bleAvailable ? (
            <p className="text-destructive text-sm text-center mt-8">
              Bluetooth is not available on this device or browser.
            </p>
          ) : (
            <div className="mt-8 w-full max-w-lg px-4 space-y-6">

              {/* Scan */}
              {bleDevices.length === 0 && (
                <Button onClick={handleScan} disabled={scanning} variant="outline" className="w-full">
                  {scanning ? "Scanning..." : "Scan Bluetooth devices"}
                </Button>
              )}

              {/* Device list */}
              {bleDevices.length > 0 && !deviceData && (
                <ul className="border rounded-md divide-y">
                  {bleDevices.map(device => (
                    <li
                      key={device.id}
                      className="px-4 py-3 flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50"
                      onClick={() => handleConnect(device)}
                    >
                      <div>
                        {device.name ?? <span className="text-muted-foreground italic">Unknown device</span>}
                        <span className="block text-xs text-muted-foreground">{device.id}</span>
                      </div>
                      {connectingId === device.id && (
                        <span className="text-xs text-muted-foreground">Connecting...</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Connected device panel */}
              {deviceData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{deviceData.device.name ?? "Unknown device"}</p>
                    <Button size="sm" variant="ghost" onClick={handleDisconnect}>Disconnect</Button>
                  </div>

                  {!pinSent ? (
                    <div className="border rounded-md p-4 space-y-3">
                      <p className="text-sm font-medium">Authenticate</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="Numeric code"
                          value={pinCode}
                          onChange={e => setPinCode(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendPin()}
                          className="text-center tracking-widest text-lg"
                        />
                        <Button disabled={pinSending || !pinCode} onClick={handleSendPin}>
                          {pinSending ? "Sending..." : "Send"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-md p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isConnected === null ? 'bg-muted-foreground' : isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Authenticated</p>
                      </div>

                      {bleDownloading === 'downloading' && (
                        <div className="flex items-center gap-2 rounded-md border border-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
                          <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Downloading keybox data...
                        </div>
                      )}
                      {bleDownloading === 'done' && (
                        <div className="flex items-center gap-2 rounded-md border border-green-400 bg-green-50 dark:bg-green-950 px-3 py-2 text-sm text-green-700 dark:text-green-300">
                          <span>✓</span> Keybox data loaded successfully
                        </div>
                      )}
                      {bleDownloading === 'error' && (
                        <div className="flex items-center gap-2 rounded-md border border-red-400 bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                          <span>✕</span> Failed to load keybox data
                        </div>
                      )}

                      {process.env.NODE_ENV === 'development' && (
                        <KeyboxDevPanel device={deviceData.device} />
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Pairing progress log */}
              <PairProgressLog steps={pairSteps} />

              {/* Unlock dialog */}
              <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Unlock your private key</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Enter the password you used to encrypt your private key on this keybox.
                  </p>
                  <Form {...unlockForm}>
                    <form onSubmit={unlockForm.handleSubmit(onUnlockSubmit)} className="space-y-2">
                      <FormField
                        control={unlockForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" autoComplete="current-password" placeholder="Password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit">Unlock</Button>
                    </form>
                  </Form>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowUnlockDialog(false)}>Cancel</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Pair section */}
              {isKeyboxInit === false && deviceData && (
                <>
                  <div className="flex justify-end">
                    <Button
                      onClick={() => setShowPairDialog(true)}
                      disabled={isPairing}
                    >
                      Put pair key on Keybox
                    </Button>
                  </div>

                  <PairPasswordDialog
                    open={showPairDialog}
                    onOpenChange={setShowPairDialog}
                    onSubmit={password => runPairing(deviceData.device, password)}
                  />
                </>
              )}

            </div>
          )}
        </div>
      </main>
    </SidebarProvider>
  )
}


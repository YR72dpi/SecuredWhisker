'use client'
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { readKeybox, writeKeybox } from "@/lib/bluetooth/keybox"
import { toast } from "sonner"

type Props = {
  device: BluetoothDevice
}

export function KeyboxDevPanel({ device }: Props) {
  const [charValue, setCharValue] = useState<string | null>(null)
  const [writeInput, setWriteInput] = useState("")
  const [busy, setBusy] = useState(false)

  const handleRead = async () => {
    setBusy(true)
    try {
      setCharValue(await readKeybox(device))
    } catch (err: unknown) {
      toast.error("Read error: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(false)
    }
  }

  const handleWrite = async () => {
    setBusy(true)
    try {
      await writeKeybox(device, writeInput)
      toast.success("Written successfully")
    } catch (err: unknown) {
      toast.error("Write error: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(false)
    }
  }

  return (
    <fieldset className="space-y-1.5 border rounded p-3">
      <legend>Development</legend>

      <p className="text-xs text-muted-foreground">Read</p>
      <div className="flex items-center gap-2">
        <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all min-w-0">
          {charValue ?? "—"}
        </code>
        <Button size="sm" variant="secondary" disabled={busy} onClick={handleRead}>
          {busy ? "..." : "Read"}
        </Button>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Write</p>
        <div className="flex items-center gap-2">
          <Input
            className="h-8 text-sm"
            placeholder="value to write"
            value={writeInput}
            onChange={e => setWriteInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleWrite()}
          />
          <Button size="sm" disabled={busy || !writeInput} onClick={handleWrite}>
            {busy ? "..." : "Write"}
          </Button>
        </div>
      </div>
    </fieldset>
  )
}

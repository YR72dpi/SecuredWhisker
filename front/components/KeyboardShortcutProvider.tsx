"use client"
import { useEffect } from "react"
import { KeyboardShortcuts } from "@/lib/KeyboardShortCut"

export function KeyboardShortcutProvider() {
    useEffect(() => {
        return KeyboardShortcuts()
    }, [])

    return null
}

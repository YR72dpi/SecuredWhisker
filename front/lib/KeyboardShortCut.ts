export const KeyboardShortcuts = () => {
    let cleanup: (() => void) | null = null

    let keysPressed: string[] = []
    let shortcutsTarget : NodeListOf<HTMLElement>|null = null

    const handler = (evt: KeyboardEvent) => {
        if(evt.key === 'Alt') evt.preventDefault() 
        keysPressed.push(evt.key)
        console.log(evt.key)

        if(keysPressed.length === 2) {
            // on check tout ceux qui ont un le combo
            const keysPressedString = keysPressed.join("+")
            const potentialTarget : HTMLElement[] = []

            shortcutsTarget?.forEach(target => {
                if(target.dataset.shortcut === keysPressedString) potentialTarget.push(target)
            })
            
            if(potentialTarget.length === 0) keysPressed = []
            if(potentialTarget.length > 1) throw Error("Multiple target for this shortcut")

            if(potentialTarget.length === 1) {
                potentialTarget[0].click()
                keysPressed = []
            }
        }
    }   

    const observer = new MutationObserver(() => {
        shortcutsTarget = document.querySelectorAll<HTMLElement>("[data-shortcut]")

        if (shortcutsTarget.length > 0 && !cleanup) {
            window.addEventListener("keydown", handler)
            console.log(shortcutsTarget)
            shortcutsTarget.forEach(el => { if (el.dataset.shortcut) el.title = el.dataset.shortcut })
            cleanup = () => window.removeEventListener("keydown", handler)
        } else if (shortcutsTarget.length === 0 && cleanup) {
            cleanup()
            cleanup = null
        }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
        observer.disconnect()
        cleanup?.()
    }
}
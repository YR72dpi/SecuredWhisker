import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Smartphone } from "lucide-react"

export function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)

    useEffect(() => {
        setIsIOS(
            /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        )

        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    }, [])

    if (!isIOS || isStandalone) return null // Don't show install button if already installed
    

    return (
        <div>
            {isIOS && (
                <>
                    <Alert className="shadow-md">
                        <Smartphone className="h-5 w-5" />
                        <AlertTitle className="font-semibold">
                            Install App - Add to Home Screen
                        </AlertTitle>
                        <AlertDescription className="flex flex-col gap-0 mt-2">
                            <p className="m-0">
                                To install this app on your iOS device, tap the share button
                                <span role="img" aria-label="share icon">
                                    {' '}
                                    ⎋{' '}
                                </span>
                                and then "Add to Home Screen"
                                <span role="img" aria-label="plus icon">
                                    {' '}
                                    ➕{' '}
                                </span>.
                            </p>

                        </AlertDescription>
                    </Alert>
                </>
            )}
        </div>
    )
}
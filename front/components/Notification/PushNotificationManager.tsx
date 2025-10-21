'use client'

import { useState, useEffect } from 'react'
import * as NotificationActions from './NotificationActions'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Bell } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { JwtTokenLib } from '@/lib/JwtTokenLib'
import { type PushSubscription } from 'web-push'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<globalThis.PushSubscription | PushSubscription | null>(null)
  const [message, setMessage] = useState('')
  const [deviceName, setDeviceName] = useState<string>("")
  const [jwtToken, setJwtToken] = useState<string>("")
  const [canShowComponent, setCanShowComponent] = useState<boolean>(false)


  const getSubscription = async (): Promise<globalThis.PushSubscription | null> => {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    const sub = await registration.pushManager.getSubscription() as globalThis.PushSubscription | null
    return sub
  }

  const subscribeToPush = async () => {

    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    }) as unknown as PushSubscription

    setSubscription(sub)
    const serializedSub = JSON.parse(JSON.stringify(sub))

    await NotificationActions.subscribeUser(serializedSub, deviceName, jwtToken)
  }

  const unsubscribeFromPush = async () => {
    const sub = await getSubscription()
    if (sub !== null) {
      await NotificationActions.unsubscribeUser(sub, jwtToken)
      await sub?.unsubscribe()
      setSubscription(null)
    }
  }

  const sendTestNotification = async () => {
    if (subscription) {
      await NotificationActions.sendNotification(JSON.stringify(subscription), message)
      setMessage('')
    }
  }

  useEffect(() => {

    (async () => {
      const jwtToken = await JwtTokenLib.isValidJwtToken()
      if (jwtToken && typeof jwtToken === "string") setJwtToken(jwtToken)

      if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log("isSupported")
        setIsSupported(true)
        const sub = await getSubscription()
        setSubscription(sub)
        setCanShowComponent(true)
      } else {
        setCanShowComponent(true)
      }
    })()

  }, [])

  return (
    canShowComponent && (
      <div>
        {subscription && process.env.NODE_ENV === "development" && (
          <>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-md p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Bell className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-green-900 font-semibold text-lg mb-1">
                    Notifications Test - Only on dev
                  </h3>
                  <p className="text-green-800 text-sm">
                    You are subscribed to push notifications.
                  </p>
                </div>
              </div>

              <button
                onClick={unsubscribeFromPush}
                className="w-full sm:w-auto px-4 py-2 border border-green-600 text-green-700 rounded-lg hover:bg-green-50 font-medium transition-colors"
              >
                Unsubscribe
              </button>

              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-green-200">
                <input
                  type="text"
                  placeholder="Enter notification message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
                />
                <button
                  onClick={sendTestNotification}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Send Test
                </button>
              </div>
            </div>
          </>
        )}

        {!subscription && (
          <>

            <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 dark:from-blue-950 to-indigo-50 dark:to-indigo-950 shadow-md">
              <Bell className="h-5 w-5" />
              <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold">
                Notification !
              </AlertTitle>
              <AlertDescription className="flex flex-col gap-3 mt-2">
                <p className="text-blue-800 dark:text-blue-100">
                  You are not subscribed to push notifications.
                </p>
                <label htmlFor="deviceName">Device Name :</label>
                <Input type="text" id="deviceName" placeholder='Device Name' onChange={(e) => setDeviceName(e.target.value)} />
                <Button
                  onClick={subscribeToPush}
                  disabled={deviceName.length <= 3}
                  className="w-full sm:w-auto text-white font-medium bg-blue-600 hover:bg-blue-700  shadow-sm"
                >
                  Subscribe to Notifications
                </Button>
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
    )
  )
}
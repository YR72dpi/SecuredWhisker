'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Bell } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { JwtTokenLib } from '@/lib/JwtTokenLib'
import { type PushSubscription } from 'web-push'
import { getSubscription, isPushNotificationSupported, subscribeToPush, unsubscribeFromPush, sendTestNotification } from '@/lib/Notification'
import { toast } from 'sonner'
import { Spinner } from '../ui/spinner'
import { isVapIdOk } from '@/lib/ServerAction/NotificationActions'
 
export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<globalThis.PushSubscription | PushSubscription | null>(null)
  const [message, setMessage] = useState('')
  const [deviceName, setDeviceName] = useState<string>("")
  const [jwtToken, setJwtToken] = useState<string>("")
  const [canShowComponent, setCanShowComponent] = useState<boolean>(false)
  const [isLoadingSubscription, setIsLoadingSubscription] = useState<boolean>(false)
  const [userAgent, setUserAgent] = useState<string>("");

  const subscribeToPushHandler = async () => {
    setIsLoadingSubscription(true)
    const sub = await subscribeToPush(deviceName, userAgent, jwtToken) as globalThis.PushSubscription | PushSubscription | null
    if (sub) {
      setSubscription(sub)
      toast.success("Your device will notify you.")
    } else {
      toast.error("Error during saving your subscription");
    }
  }

  const unsubscribeFromPushHandler = async () => {
    await unsubscribeFromPush(jwtToken)
    setSubscription(null)
  }

  const sendTestNotificationHandler = async () => {
    const sub = subscription as globalThis.PushSubscription | null
    if (sub) await sendTestNotification(sub, message)
  }

  useEffect(() => {

    (async () => {
      const jwtToken = await JwtTokenLib.isValidJwtToken()
      if (jwtToken && typeof jwtToken === "string") setJwtToken(jwtToken)
      
      setUserAgent(navigator.userAgent )

      const vapidOk = await isVapIdOk()
      if (isPushNotificationSupported() && vapidOk) {
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
                onClick={unsubscribeFromPushHandler}
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
                  onClick={sendTestNotificationHandler}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  Send Test
                </button>
              </div>
            </div>
          </>
        )}

        {!subscription && isSupported && (
          <>
            <Alert>
              <Bell/>
              <AlertTitle className="font-semibold">
                Notification !
              </AlertTitle>
              <AlertDescription className="flex flex-col gap-3">
                <p>
                  You are not subscribed to push notifications.
                </p>
                <label htmlFor="deviceName">Device Name :</label>
                <Input type="text" id="deviceName" placeholder='Device Name' onChange={(e) => setDeviceName(e.target.value)} />
                <Button
                  onClick={subscribeToPushHandler}
                  disabled={(deviceName !== null && (deviceName.length + 1) <= 3) || isLoadingSubscription}
                >
                  {isLoadingSubscription ? <Spinner /> : ("Subscribe to Notifications")}
                </Button>
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
    )
  )
}
'use client'
import * as NotificationActions from "./ServerAction/NotificationActions"

export const isPushNotificationSupported = 'serviceWorker' in navigator && 'PushManager' in window;
export const isPushNotificationDenied = typeof window !== 'undefined' && Notification.permission === 'denied'


export const getSubscription = async (): Promise<globalThis.PushSubscription | null> => {
    const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
    })
    const sub = await registration.pushManager.getSubscription() as globalThis.PushSubscription | null
    return sub
}

export const subscribeToPush = async (deviceName: string, jwtToken: string): Promise<PushSubscription|null> => {
    let sub = null
    try {
        const registration = await navigator.serviceWorker.ready
        sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
            ),
        }) as unknown as PushSubscription
    } catch (err: any) {
        throw new Error("Error during generating the Push Subscription", err)
    }

    if (sub !== null) {
        const serializedSub = JSON.parse(JSON.stringify(sub))
        await NotificationActions.subscribeUser(serializedSub, deviceName, jwtToken)
        return sub
    }
    return null
}

export const unsubscribeFromPush = async (jwtToken: string): Promise<boolean> => {
    const sub = await getSubscription()
    if (sub !== null) {
        const subscriptionPayload = btoa(JSON.stringify(sub))
        await NotificationActions.unsubscribeUser(subscriptionPayload, jwtToken)
        await sub?.unsubscribe()
        return true
    }
    return false

}

export const deleteSubscription = async (subscriptionToDelete: string, jwtToken: string) => {
    const subscriptonDecode = JSON.parse(atob(subscriptionToDelete)) as PushSubscription
    const thisBrowserSubscription = await getSubscription()

    if (
        thisBrowserSubscription &&
        subscriptonDecode.endpoint === thisBrowserSubscription.endpoint
    ) {
        await thisBrowserSubscription.unsubscribe()
    }

    if (jwtToken !== null) await NotificationActions.unsubscribeUser(subscriptionToDelete, jwtToken)
}

export const sendTestNotification = async (subscription: PushSubscription, message: string) => {
    if (subscription && message !== "") await NotificationActions.sendNotification(JSON.stringify(subscription), message)
}

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
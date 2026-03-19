'use client'
import { API_PROTOCOL } from "./NetworkProtocol"
import * as NotificationActions from "./ServerAction/NotificationActions"

export type NotificationSubscriptionResponse = {
    getId: number
    getDeviceName: string
    getUserAgent: string
    getSubscription: string
}

export const isPushNotificationSupported = (): boolean => {
    return 'serviceWorker' in navigator && 'PushManager' in window
}

export const isPushNotificationDenied = (): boolean => {
    return typeof window !== 'undefined' && Notification.permission === 'denied'
}

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isPushNotificationSupported()) return null

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none',
        })

        await navigator.serviceWorker.ready

        return registration
    } catch (error) {
        console.error('Service Worker registration failed:', error)
        return null
    }
}

export const getSubscription = async (): Promise<globalThis.PushSubscription | null> => {
    if (!isPushNotificationSupported()) return null

    try {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.getSubscription() as globalThis.PushSubscription | null
        return sub
    } catch (error) {
        console.error('Error getting subscription:', error)
        return null
    }
}

export const subscribeToPush = async (deviceName: string, userAgent: string, jwtToken: string): Promise<PushSubscription | null> => {
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
        // Log détaillé pour le debugging
        console.error("Push subscription failed:", {
            name: err.name,
            message: err.message,
            code: err.code,
            stack: err.stack
        })
        // Map des erreurs communes
        const errorMessages: Record<string, string> = {
            'NotAllowedError': 'Permission refusée. Autorisez les notifications dans votre navigateur.',
            'NotSupportedError': 'Notifications non supportées sur ce navigateur.',
            'AbortError': 'Souscription annulée par l\'utilisateur.',
            'InvalidStateError': 'Service worker dans un état invalide. Rechargez la page.',
        }
        const userMessage = errorMessages[err.name] ||
            `Erreur lors de l'inscription aux notifications: ${err.message}`
        throw new Error(userMessage)
    }
    if (sub !== null) {
        const serializedSub = JSON.parse(JSON.stringify(sub))
        await NotificationActions.subscribeUser(serializedSub, deviceName, userAgent, jwtToken)
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

export const fetchSubscriptionFromDb = async (jwtToken: string): Promise<null | NotificationSubscriptionResponse[]> => {

    const myHeaders = new Headers();
    myHeaders.append("Authorization", "Bearer " + jwtToken);

    const requestOptions: RequestInit = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow"
    };

    return await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfNotificationSubscription", requestOptions)
        .then((response) => response.json())
        .then(async (result) => {
            const data = result.data as NotificationSubscriptionResponse[]
            return data
        })
        .catch((error: any) => {
            console.error(error)
            throw new Error(error)
        });
}

export const deleteBrowserSubscriptionIfNotFindOnDb = async (jwtToken: string): Promise<boolean> => {
    const thisBrowserSubscription = await getSubscription()
    const selfNotificationDataPayload = await fetchSubscriptionFromDb(jwtToken)
    let thisBrowserSubScriptionFind = false

    if (selfNotificationDataPayload === null) return false;
    if (thisBrowserSubscription === null) return false;

    if (selfNotificationDataPayload.length === 0) {
        await thisBrowserSubscription?.unsubscribe()
        return true;
    }

    if (selfNotificationDataPayload.length > 0) selfNotificationDataPayload.forEach((payload) => {
        const decodedSubscription = JSON.parse(atob(payload.getSubscription)) as PushSubscription
        if (
            !thisBrowserSubScriptionFind
            && thisBrowserSubscription?.endpoint === decodedSubscription.endpoint
        ) {
            thisBrowserSubScriptionFind = true
        }
    })

    if (!thisBrowserSubScriptionFind) {
        await thisBrowserSubscription?.unsubscribe()
        return true
    }

    return false;
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
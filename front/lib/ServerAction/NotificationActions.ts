'use server'
import { API_PROTOCOL } from '@/lib/NetworkProtocol'
import webpush from 'web-push'
import { type PushSubscription } from 'web-push'

export async function isVapIdOk() : Promise<boolean> {
  return !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY
}

export async function subscribeUser(
  sub: PushSubscription,
  deviceName: string,
  userAgent: string,
  jwtToken: string
) {

  const subscriptionPayload = btoa(JSON.stringify(sub))

  const data = JSON.stringify({
    deviceName: deviceName,
    userAgent: userAgent,
    subsciption: subscriptionPayload
  })

  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer " + jwtToken);

  const requestOptions: RequestInit = {
    method: "POST",
    headers: myHeaders,
    body: data,
    redirect: "follow"
  };

  return await fetch(
    API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/notification/addSubscription",
    requestOptions
  )
    .then((response) => response.json())
    .then(() => {
      return { success: true }
    })
    .catch((error) => console.error(error));


}

export async function unsubscribeUser(
  sub: string,
  jwtToken: string
) {

  const data = JSON.stringify({
    subsciption: sub
  })

  const myHeaders = new Headers();
  myHeaders.append("Authorization", "Bearer " + jwtToken);

  const requestOptions: RequestInit = {
    method: "POST",
    headers: myHeaders,
    body: data,
    redirect: "follow"
  };

  return await fetch(
    API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/notification/removeSubscription",
    requestOptions
  )
    .then((response) => response.json())
    .then((result) => {
      console.log(result)
      return { success: true }
    })
    .catch((error) => console.error(error));
}

export async function sendNotification(sub: string, from: string) {
  const subsciption = JSON.parse(sub) as PushSubscription
  if (!sub) throw new Error('No subscription available')

  try {
    await webpush.sendNotification(
      subsciption,
      JSON.stringify({
        title: 'Secured Whiker',
        body: "New messages from " + from,
        icon: '/icon/icon-192x192.png',
      })
    )
    return { success: true }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: 'Failed to send notification' }
  }
}

(async () => {
  if (await isVapIdOk()) {
  webpush.setVapidDetails(
    'mailto:dev@localhost.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
}
})()
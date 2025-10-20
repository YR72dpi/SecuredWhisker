'use server'
import { API_PROTOCOL } from '@/lib/NetworkProtocol'
import webpush from 'web-push'
import { type PushSubscription } from 'web-push'

webpush.setVapidDetails(
  'mailto:dev@localhost.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function subscribeUser(
  sub: PushSubscription, 
  deviceName: string,
  jwtToken: string
) {
  
  const subscriptionPayload = btoa(JSON.stringify(sub))

  const data = JSON.stringify({
    deviceName: deviceName,
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
    .then((result) => {
      return { success: true }
    })
    .catch((error) => console.error(error));

  
}

// export async function unsubscribeUser() {
//   let sub = null
//   // In a production environment, you would want to remove the subscription from the database
//   // For example: await db.subscriptions.delete({ where: { ... } })
//   return { success: true }
// }

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
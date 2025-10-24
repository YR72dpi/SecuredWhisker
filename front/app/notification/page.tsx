"use client"
import { SwDb } from "@/lib/SwDatabase";
import { useEffect, useRef, useState, useCallback } from "react";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, ChevronLeftIcon, Trash2 } from "lucide-react";
import { JwtTokenLib } from "@/lib/JwtTokenLib";
import { SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { deleteSubscription, getSubscription } from "@/lib/Notification";
import { deleteSubscription, getSubscription } from "@/lib/Notification";
import { Spinner } from "@/components/ui/spinner";
import { parseUserAgent, UserAgentInfo } from "@/lib/UserAgentInfo";

import { LuSmartphone, LuTablet, LuMonitor, LuBot } from "react-icons/lu";
import { FaWindows, FaApple, FaLinux, FaAndroid, FaChrome, FaFirefoxBrowser, FaSafari } from "react-icons/fa";
import { PushSubscription } from "web-push";
import { PushSubscription } from "web-push";

type NotificationSubscriptionResponse = {
	getId: number
	getDeviceName: string
	getUserAgent: string
	getSubscription: string
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export default function Home() {
	const [canShowPage, setCanShowPage] = useState(false)

	const hasPrivateKey = useRef<boolean>(false)
	const [selfNotificationDataPayload, setSelfNotificationDataPayload] = useState<NotificationSubscriptionResponse[]>([])

	const [subscriptionToDelete, setSubscriptionToDelete] = useState<NotificationSubscriptionResponse | null>(null)
	const [jwtTokenForDelete, setJwtTokenForDelete] = useState<string | null>(null)
	const [isDeleting, setIsDeleting] = useState<boolean>(false)



	const deleteBrowserSubscriptionIfNotFindOnDb = async () => {
		const thisBrowserSubscription = await getSubscription()

		let thisBrowserSubScriptionFind = false
		selfNotificationDataPayload.forEach((payload) => {
			const decodedSubscription = JSON.parse(atob(payload.getSubscription)) as PushSubscription
			if (
				!thisBrowserSubScriptionFind
				&& thisBrowserSubscription?.endpoint === decodedSubscription.endpoint
			) {
				thisBrowserSubScriptionFind = true
			}
		})

		if (!thisBrowserSubScriptionFind) await thisBrowserSubscription?.unsubscribe()
	}

	useEffect(() => {

		(async () => {

			const jwtToken = await JwtTokenLib.isValidJwtToken()
			if (process.env.NODE_ENV === "development") console.log("JWT Token: " + jwtToken)
			if (!jwtToken) window.location.replace("/");
			if (typeof jwtToken === "string") setJwtTokenForDelete(jwtToken)

			const privateKeyInterface = await SwDb.getPrivateKey()
			hasPrivateKey.current = privateKeyInterface ? true : false

			const myHeaders = new Headers();
			myHeaders.append("Authorization", "Bearer " + jwtToken);

			const requestOptions: RequestInit = {
				method: "GET",
				headers: myHeaders,
				redirect: "follow"
			};

			await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfNotificationSubscription", requestOptions)
				.then((response) => response.json())
				.then(async (result) => {
					const data = result.data as NotificationSubscriptionResponse[]
					setSelfNotificationDataPayload(data)
					setCanShowPage(true)
				})
				.catch((error) => console.error(error));


		})()
	}, [])

	useEffect(() => {
		deleteBrowserSubscriptionIfNotFindOnDb()
	}, [selfNotificationDataPayload])

	const confirmBeforeDelete = async (subscriptionId: NotificationSubscriptionResponse) => {
		setSubscriptionToDelete(subscriptionId)
	}

	// delete the subscription choosen by user on database
	// delete the browser subscription if it's in this browser
	const deleteSubscriptionHander = async (subscriptionToDelete: string) => {
		setIsDeleting(true)
		if (jwtTokenForDelete) await deleteSubscription(subscriptionToDelete, jwtTokenForDelete)
		setSubscriptionToDelete(null)
		setIsDeleting(false)
	}

	const DeviceIcons = (uaInfo: UserAgentInfo) => {
		const getDeviceIcon = () => {
			switch (uaInfo.deviceType) {
				case 'mobile': return <LuSmartphone size={24} />;
				case 'tablet': return <LuTablet size={24} />;
				case 'desktop': return <LuMonitor size={24} />;
				case 'bot': return <LuBot size={24} />;
				default: return "";
			}
		};

		const getOSIcon = () => {
			const os = uaInfo.os.toLowerCase();
			if (os.includes('windows')) return <FaWindows size={24} />;
			if (os.includes('mac') || os.includes('ios')) return <FaApple size={24} />;
			if (os.includes('linux')) return <FaLinux size={24} />;
			if (os.includes('android')) return <FaAndroid size={24} />;
			return "";
		};

		const getBrowserIcon = () => {
			const browser = uaInfo.browser.toLowerCase();
			if (browser.includes('chrome')) return <FaChrome size={24} />;
			if (browser.includes('firefox')) return <FaFirefoxBrowser size={24} />;
			if (browser.includes('safari')) return <FaSafari size={24} />;
			return "";
		};

		return (
			<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
				{getDeviceIcon()}
				{getOSIcon()}
				{getBrowserIcon()}
			</div>
		);
	}

	return (

		<SidebarProvider>

			<main className="w-full border p-3 flex flex-col gap-3">
				<Link href={"/chat"} prefetch={true} >
					<Button variant="secondary" size="icon" className="size-8" >
						<ChevronLeftIcon />
					</Button>
				</Link>
				<>

					<div className="w-full max-w-[428px] mx-auto">
						<h1 className="font-bold text-xl mb-3">Notification receiving device</h1>

						{canShowPage ? (
							<>
								{subscriptionToDelete && (
									<Alert variant="default">
										<AlertCircleIcon />
										<AlertTitle className="font-bold">Delete the notification subscription for {subscriptionToDelete.getDeviceName}</AlertTitle>
										<AlertDescription>
											<p>Are you sure you want to delete notifications for the device "{subscriptionToDelete.getDeviceName}"?</p>
											<div className="p-3 flex gap-3 justify-end">
												<Button
													variant="destructive"
													onClick={() => deleteSubscriptionHander(subscriptionToDelete.getSubscription)}
													disabled={isDeleting}
												>
													{isDeleting ? (
														<>
															<Spinner /> Deleting...
														</>
													) : "Yes, delete it !"}
												</Button>
												<Button
													variant="secondary"
													disabled={isDeleting}
													onClick={() => setSubscriptionToDelete(null)}
												>Nop</Button>
											</div>
										</AlertDescription>
									</Alert>
								)}


								{selfNotificationDataPayload.length > 0 ? (
									<ul className="w-full my-0 mx-auto flex flex-wrap gap-3">
										{selfNotificationDataPayload.map(payload => (
											<li key={payload.getId} className="w-52 h-32 border rounded-xl p-3 flex-[0 1 50%] flex flex-col justify-between">
												<div className="h-full flex items-center justify-center">
													{DeviceIcons(parseUserAgent(payload.getUserAgent))}
												</div>
												<div className="h-[44px] flex items-center justify-between">
													<p className="w-full truncate pr-1">{payload.getDeviceName}</p>
													<Button
														className="w-[44px] h-[44px]"
														disabled={!!subscriptionToDelete}
														onClick={() => confirmBeforeDelete(payload)}
													>
														<Trash2 />
													</Button>
												</div>
											</li>
										))}
									</ul>
								) : (
									<p className="px-3 text-center">You didn't subscribe on any device ! 🤷‍♂️</p>
								)}
							</>
						) : (
							<div className="w-full p-3 flex items-center justify-center min-h-[50vh]">
								<Spinner className="size-8" />
							</div>
						)}
					</div>
				</>

			</main>
		</SidebarProvider>
	);
}
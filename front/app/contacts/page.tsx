"use client"
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, ChevronLeftIcon, Trash2 } from "lucide-react";
import { JwtTokenLib } from "@/lib/JwtTokenLib";
import { SidebarProvider } from "@/components/ui/sidebar"
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { ReceiverDataForChat } from "@/components/chat";

export default function Home() {
	const [canShowPage, setCanShowPage] = useState(false)

	const [jwtToken, setJwtToken] = useState<string | null>(null)
	const [isDeleting, setIsDeleting] = useState<boolean>(false)
	const [contactList, setContactList] = useState<ReceiverDataForChat[]>([])
	const [contactToDelete, setContactToDelete] = useState<ReceiverDataForChat | null>(null)



	useEffect(() => {
		(async () => {
			const jwtTokenValid = await JwtTokenLib.isValidJwtToken()
			if (process.env.NODE_ENV === "development") console.log("JWT Token: " + jwtTokenValid)
			if (!jwtTokenValid) window.location.replace("/")

			setJwtToken(jwtTokenValid)

			if(jwtToken) await getContacts()
		})()
	}, [jwtToken])

	const getContacts = async () => {
		(async () => {
			setContactList([])
			const myHeaders = new Headers();
			myHeaders.append("Content-Type", "application/json");
			myHeaders.append("Authorization", "Bearer " + jwtToken);

			const requestOptions: RequestInit = {
				method: "GET",
				headers: myHeaders,
				redirect: "follow",
				cache: "no-cache"
			};

			const response = await fetch(
				API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/contacts",
				requestOptions
			);

			if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

			const result = await response.json();
			const data = result.data as ReceiverDataForChat[]

			setContactList(data)

			setCanShowPage(true)

		})()
	}

	const deleteContact = async (contactData: ReceiverDataForChat) => {
		const contactToDeleteId = contactData.id
		setIsDeleting(true)

		const myHeaders = new Headers();
		myHeaders.append("Content-Type", "application/json");
		myHeaders.append("Authorization", "Bearer " + jwtToken);

		const requestOptions: RequestInit = {
			method: "POST",
			headers: myHeaders,
			body: JSON.stringify({
				userIdToDelete: contactToDeleteId
			}),
			redirect: "follow",
			cache: "no-cache"
		};

		const response = await fetch(
			API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/removeFriend",
			requestOptions
		);

		const result = await response.json();

		if (!response.ok) {
			toast.error("Something went wrong...")
			console.error(result.message)
		}

		if (response.ok && result.message === "ok") toast.success("The contact has been deleted")

		await getContacts()
		setIsDeleting(false)
		setContactToDelete(null)

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

					<div className="w-full max-w-[428px] mx-auto flex flex-col gap-3">
						<h1 className="font-bold text-xl mb-3">Manage contacts</h1>

						{contactToDelete && (
							<Alert variant="default">
								<AlertCircleIcon />
								<AlertTitle className="font-bold">Delete your friend {contactToDelete.username}</AlertTitle>
								<AlertDescription>
									<p>Are you sure you want to delete <span className="font-bold">{contactToDelete.username}</span> ?</p>
									<div className="p-3 flex gap-3 justify-end">
										<Button
											variant="destructive"
											onClick={() => deleteContact(contactToDelete)}
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
											onClick={() => setContactToDelete(null)}
										>Nop</Button>
									</div>
								</AlertDescription>
							</Alert>
						)}

						{canShowPage ? (
							<>
								{/* setHasContactToDelete */}
								<ul className="mt-2 space-y-2 flex flex-col items-center gap-2">
									{contactList.length > 0 ? (
										contactList.map((contact) => (
										<li
											key={contact.id}
											className={
												"border-b break-all w-[300px] max-w-[90%] h-11 leading-10 transition-colors flex justify-between "
												+
												(isDeleting ? "opacity-75" : "")
											}

										>
											<div>{contact.username ?? "Contact sans nom"}
												<span className="text-sm text-gray-500 italic">
													{contact.uniqid ? " (" + contact.uniqid + ")" : ""}
												</span>
											</div>
											<Button
												onClick={() => { if (!isDeleting) setContactToDelete(contact) }}
											>
												<Trash2 />
											</Button>
										</li>
									))
									) : (
										<p className="mt-2 space-y-2 flex flex-col items-center gap-2">No contact</p>
									)}
								</ul>
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
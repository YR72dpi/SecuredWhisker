"use client"
import { Chat, SenderDataForChat, ReceiverDataForChat } from "@/components/chat";
import { ContactList } from "@/components/Friendship/contactList";
import { SwDb } from "@/lib/SwDatabase";
import { useEffect, useRef, useState } from "react";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon } from "lucide-react";
import { JwtTokenLib } from "@/lib/JwtTokenLib";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar";
import { PushNotificationManager } from "@/components/Notification/PushNotificationManager";
import { InstallPrompt } from "@/components/Notification/InstallPrompt";
import { deleteBrowserSubscriptionIfNotFindOnDb, isPushNotificationSupported } from "@/lib/Notification";
import { toast } from "sonner";

export default function Home() {
    const [canShowPage, setCanShowPage] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    const [identifier, setIdentifier] = useState<string | null>(null)
    const hasPrivateKey = useRef<boolean>(false)

    const [senderData, setSenderData] = useState<SenderDataForChat>(); // you
    const [selectedContact, setSelectedContact] = useState<ReceiverDataForChat | null>(null); // the choosen friend

    useEffect(() => {
        const initializePage = async () => {
            try {
                console.log("🔍 Initialisation de la page...");

                // Vérification du JWT Token
                const jwtToken = await JwtTokenLib.isValidJwtToken()
                console.log("Token valide:", !!jwtToken);
                
                if (process.env.NODE_ENV === "development") {
                    console.log("JWT Token:", jwtToken)
                }
                
                if (!jwtToken) {
                    console.log("❌ Pas de token valide, redirection...");
                    window.location.replace("/");
                    return;
                }

                // Vérification de la clé privée
                const privateKeyInterface = await SwDb.getPrivateKey()
                hasPrivateKey.current = !!privateKeyInterface
                console.log("Clé privée présente:", hasPrivateKey.current);

                // Vérification de l'abonnement aux notifications
                const isThisBrowserSubscriptionDeletedOnBase = await deleteBrowserSubscriptionIfNotFindOnDb(jwtToken)
                if (isThisBrowserSubscriptionDeletedOnBase) {
                    toast.info(
                        "The registration for push notifications for this browser was not found in the database and has been deleted.",
                        { duration: 5000 }
                    )
                }

                // Construction de l'URL
                const apiUrl = `${API_PROTOCOL}://${process.env.NEXT_PUBLIC_USER_HOST}/api/protected/selfUserData`;
                console.log("📡 URL de la requête:", apiUrl);

                // Configuration de la requête
                const myHeaders = new Headers();
                myHeaders.append("Authorization", `Bearer ${jwtToken}`);

                const requestOptions: RequestInit = {
                    method: "GET",
                    headers: myHeaders,
                    redirect: "follow"
                };

                // Récupération des données utilisateur
                console.log("📤 Envoi de la requête...");
                const response = await fetch(apiUrl, requestOptions);
                
                console.log("📥 Réponse reçue - Status:", response.status);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                console.log("✅ Données utilisateur reçues:", result);

                // Mise à jour des états
                setIdentifier(result.identifier)
                setSenderData({
                    id: result.id,
                    username: result.username,
                    publicKey: result.publicKey
                });

                setCanShowPage(true)
                console.log("✅ Page prête à être affichée");

            } catch (error) {
                console.error("❌ Erreur lors de l'initialisation:", error);
                toast.error("Une erreur est survenue lors du chargement de la page");
            } finally {
                setIsLoading(false);
            }
        }

        initializePage();
    }, [])

    // Log pour suivre les changements d'état
    useEffect(() => {
        console.log("État - canShowPage:", canShowPage, "senderData:", senderData);
    }, [senderData, canShowPage])

    // Affichage d'un loader pendant le chargement
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    // Si les données ne sont pas prêtes, ne rien afficher
    if (!canShowPage || !senderData) {
        return null;
    }

    return (
        <SidebarProvider>
            <AppSidebar
                username={senderData.username}
                identifier={identifier}
                publicKey={senderData.publicKey}
            />
            <main className="w-full border p-3 flex flex-col gap-3">
                <SidebarTrigger />

                {isPushNotificationSupported() && <PushNotificationManager />}
                <InstallPrompt />

                {!hasPrivateKey.current && (
                    <Alert variant="destructive">
                        <AlertCircleIcon />
                        <AlertTitle className="font-bold">No private key here 😥</AlertTitle>
                        <AlertDescription>
                            <p>To decode your message, you need to have your private key on this browser</p>
                            <ul className="list-inside list-disc text-sm">
                                <li>
                                    On the browser where you subscribe: Side bar {">"} Security {">"} Private key transfert (tx)
                                </li>
                                <li>
                                    On the this browser: Menu bar {">"} Security {">"} Private key transfert (rx)
                                </li>
                            </ul>
                        </AlertDescription>
                    </Alert>
                )}

                {hasPrivateKey.current && identifier && !selectedContact && (
                    <ContactList
                        onSelectContact={setSelectedContact}
                    />
                )}

                {hasPrivateKey.current && senderData && selectedContact && (
                    <Chat
                        senderDataForChat={senderData}
                        receiverDataForChat={selectedContact}
                        setContactData={setSelectedContact}
                    />
                )}
            </main>
        </SidebarProvider>
    );
}
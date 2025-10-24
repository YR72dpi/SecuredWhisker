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
import { Spinner } from "@/components/ui/spinner";
import { parseUserAgent, UserAgentInfo } from "@/lib/UserAgentInfo";

import { LuSmartphone, LuTablet, LuMonitor, LuBot } from "react-icons/lu";
import { FaWindows, FaApple, FaLinux, FaAndroid, FaChrome, FaFirefoxBrowser, FaSafari } from "react-icons/fa";
import { PushSubscription } from "web-push";

type NotificationSubscriptionResponse = {
    getId: number
    getDeviceName: string
    getUserAgent: string
    getSubscription: string
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export default function Home() {
    // États principaux
    const [loadingState, setLoadingState] = useState<LoadingState>('loading');
    const [subscriptions, setSubscriptions] = useState<NotificationSubscriptionResponse[]>([]);
    const [jwtToken, setJwtToken] = useState<string | null>(null);
    
    // États de suppression
    const [subscriptionToDelete, setSubscriptionToDelete] = useState<NotificationSubscriptionResponse | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Refs pour éviter les re-renders inutiles
    const hasPrivateKey = useRef<boolean>(false);
    const hasCheckedBrowserSub = useRef<boolean>(false);

    // Fonction pour charger les données initiales
    const initializeData = useCallback(async () => {
        try {
            setLoadingState('loading');

            const token = await JwtTokenLib.isValidJwtToken();
            if (process.env.NODE_ENV === "development") console.log("JWT Token:", token);
            
            if (!token) {
                window.location.replace("/");
                return;
            } else {
                setJwtToken(token as string);
            }

            const privateKeyInterface = await SwDb.getPrivateKey();
            hasPrivateKey.current = !!privateKeyInterface;

            const myHeaders = new Headers();
            myHeaders.append("Authorization", `Bearer ${token}`);

            const response = await fetch(
                `${API_PROTOCOL}://${process.env.NEXT_PUBLIC_USER_HOST}/api/protected/selfNotificationSubscription`,
                {
                    method: "GET",
                    headers: myHeaders,
                    redirect: "follow"
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch subscriptions');
            }

            const result = await response.json();
            const data = result.data as NotificationSubscriptionResponse[];
            
            setSubscriptions(data);
            setLoadingState('success');

        } catch (error) {
            console.error("Initialization error:", error);
            setLoadingState('error');
        }
    }, []);

    const cleanupBrowserSubscription = useCallback(async () => {
        if (hasCheckedBrowserSub.current || subscriptions.length === 0) return;
        
        try {
            const thisBrowserSubscription = await getSubscription();
            if (!thisBrowserSubscription) return;

            const subscriptionExists = subscriptions.some((payload) => {
                try {
                    const decodedSubscription = JSON.parse(atob(payload.getSubscription)) as PushSubscription;
                    return thisBrowserSubscription.endpoint === decodedSubscription.endpoint;
                } catch (error) {
                    console.error("Error decoding subscription:", error);
                    return false;
                }
            });

            if (!subscriptionExists) {
                console.log("Browser subscription not found in DB, unsubscribing...");
                await thisBrowserSubscription.unsubscribe();
            }

            hasCheckedBrowserSub.current = true;
        } catch (error) {
            console.error("Error cleaning up browser subscription:", error);
        }
    }, [subscriptions]);

    const handleDeleteSubscription = useCallback(async (subscription: NotificationSubscriptionResponse) => {
        if (!jwtToken) return;

        try {
            setIsDeleting(true);

            await deleteSubscription(subscription.getSubscription, jwtToken);

            setSubscriptions(prev => prev.filter(sub => sub.getId !== subscription.getId));
            
            const thisBrowserSubscription = await getSubscription();
            if (thisBrowserSubscription) {
                try {
                    const decodedSubscription = JSON.parse(atob(subscription.getSubscription)) as PushSubscription;
                    if (thisBrowserSubscription.endpoint === decodedSubscription.endpoint) {
                        await thisBrowserSubscription.unsubscribe();
                    }
                } catch (error) {
                    console.error("Error checking browser subscription:", error);
                }
            }

            setSubscriptionToDelete(null);
        } catch (error) {
            console.error("Error deleting subscription:", error);
        } finally {
            setIsDeleting(false);
        }
    }, [jwtToken]);

    const DeviceIcons = useCallback(({ uaInfo }: { uaInfo: UserAgentInfo }) => {
        const getDeviceIcon = () => {
            switch (uaInfo.deviceType) {
                case 'mobile': return <LuSmartphone size={24} />;
                case 'tablet': return <LuTablet size={24} />;
                case 'desktop': return <LuMonitor size={24} />;
                case 'bot': return <LuBot size={24} />;
                default: return null;
            }
        };

        const getOSIcon = () => {
            const os = uaInfo.os.toLowerCase();
            if (os.includes('windows')) return <FaWindows size={24} />;
            if (os.includes('mac') || os.includes('ios')) return <FaApple size={24} />;
            if (os.includes('linux')) return <FaLinux size={24} />;
            if (os.includes('android')) return <FaAndroid size={24} />;
            return null;
        };

        const getBrowserIcon = () => {
            const browser = uaInfo.browser.toLowerCase();
            if (browser.includes('chrome')) return <FaChrome size={24} />;
            if (browser.includes('firefox')) return <FaFirefoxBrowser size={24} />;
            if (browser.includes('safari')) return <FaSafari size={24} />;
            return null;
        };

        return (
            <div className="flex gap-3 items-center">
                {getDeviceIcon()}
                {getOSIcon()}
                {getBrowserIcon()}
            </div>
        );
    }, []);

    useEffect(() => {
        initializeData();
    }, [initializeData]);

    useEffect(() => {
        if (loadingState === 'success') {
            cleanupBrowserSubscription();
        }
    }, [loadingState, cleanupBrowserSubscription]);

    if (loadingState === 'loading') {
        return (
            <SidebarProvider>
                <main className="w-full border p-3 flex items-center justify-center min-h-screen">
                    <Spinner className="" />
                </main>
            </SidebarProvider>
        );
    }

    if (loadingState === 'error') {
        return (
            <SidebarProvider>
                <main className="w-full border p-3">
                    <Alert variant="destructive">
                        <AlertCircleIcon />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            Failed to load your notification subscriptions. Please try again.
                        </AlertDescription>
                    </Alert>
                </main>
            </SidebarProvider>
        );
    }

    return (
        <SidebarProvider>
            <main className="w-full border p-3 flex flex-col gap-3">
                <Link href="/chat" prefetch={true}>
                    <Button variant="secondary" size="icon" className="size-8">
                        <ChevronLeftIcon />
                    </Button>
                </Link>

                <div className="w-full max-w-[428px] mx-auto">
                    <h1 className="font-bold text-xl mb-3">Notification receiving devices</h1>

                    {/* Dialogue de confirmation de suppression */}
                    {subscriptionToDelete && (
                        <Alert variant="default" className="mb-3">
                            <AlertCircleIcon />
                            <AlertTitle className="font-bold">
                                Delete notification subscription for {subscriptionToDelete.getDeviceName}
                            </AlertTitle>
                            <AlertDescription>
                                <p className="mb-3">
                                    Are you sure you want to delete notifications for the device "{subscriptionToDelete.getDeviceName}"?
                                </p>
                                <div className="flex gap-3 justify-end">
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleDeleteSubscription(subscriptionToDelete)}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Spinner className="mr-2" /> Deleting...
                                            </>
                                        ) : (
                                            "Yes, delete it!"
                                        )}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        disabled={isDeleting}
                                        onClick={() => setSubscriptionToDelete(null)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Liste des appareils */}
                    {subscriptions.length > 0 ? (
                        <ul className="w-full flex flex-wrap gap-3">
                            {subscriptions.map(payload => (
                                <li 
                                    key={payload.getId} 
                                    className="w-full sm:w-52 h-32 border rounded-xl p-3 flex flex-col justify-between hover:shadow-md transition-shadow"
                                >
                                    <div className="h-full flex items-center justify-center">
                                        <DeviceIcons uaInfo={parseUserAgent(payload.getUserAgent)} />
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate flex-1 font-medium">
                                            {payload.getDeviceName}
                                        </p>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="size-10 shrink-0"
                                            disabled={!!subscriptionToDelete || isDeleting}
                                            onClick={() => setSubscriptionToDelete(payload)}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">
                                You haven't subscribed on any device yet! 🤷‍♂️
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </SidebarProvider>
    );
}
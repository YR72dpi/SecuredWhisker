"use client"
import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ChatLib, MessagePayload } from "@/lib/ChatLib";
import { RsaLib } from "@/lib/Crypto/RsaLib";
import { SwDb } from "@/lib/SwDatabase";
import { AesLib } from "@/lib/Crypto/AesLib";
import { ChevronLeftIcon, Send } from "lucide-react";
import { API_PROTOCOL, WS_PROTOCOL } from "@/lib/NetworkProtocol";
import { sha256 } from "@/lib/Crypto/sha256";
import { Switch } from "./ui/switch";
import { toast } from "sonner";

export type ContactDataForChat = {
    id: string;
    username: string;
    uniqid: string;
    publicKey: string;
}

type ChatProps = {
    username: string;
    userId: string;
    userPublicKey: string
    contactData: ContactDataForChat;
    setContactData: (newContactData: ContactDataForChat | null) => void
};

type RecoverRegisteredMessage = {
    message: string
    messagesRegistered: string[]
    server_time: string
}

export function Chat({
    username,
    userId,
    userPublicKey,
    contactData,
    setContactData
}: ChatProps) {
    const [messages, setMessages] = useState<{ from: string; message: string; }[]>([])
    const ws = useRef<WebSocket | null>(null)
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const [input, setInput] = useState<string>("")
    const [connectionState, setConnectionState] = useState<number>(0)
    const [selectedLanguage, setSelectedLanguage] = useState<string>("");
    const [haveToSaveMessage, setHaveToSaveMessage] = useState<boolean>(true);
    const [isSavedMessagesPrinted, setIsSavedMessagePrint] = useState<boolean>(false)
    const showLanguageSelector = !!process.env.NEXT_PUBLIC_GPT_API_KEY;

    const room = ChatLib.getRoomName(userId, contactData.id)
    const reconnectInterval = useRef<NodeJS.Timeout>();

    const connectWebSocket = useCallback(() => {
        if (!room) return;

        const socket = new WebSocket(WS_PROTOCOL + "://" + process.env.NEXT_PUBLIC_MESSAGE_HOST + `/ws?room=${room}`);
        ws.current = socket;

        socket.onopen = () => {
            setConnectionState(1);
            console.log("Connected");
            // Clear reconnection interval if connection successful
            if (reconnectInterval.current) {
                clearInterval(reconnectInterval.current);
                reconnectInterval.current = undefined;
            }

        };

        socket.onmessage = async (event) => {
            try {
                const parsedMessage: MessagePayload = JSON.parse(event.data);
                console.log("Received message:", parsedMessage); // Ajoutez ce log

                if (parsedMessage.fromUsername !== username) {
                    const ivMessage = parsedMessage.aesInitialValue;
                    const privateKey = await SwDb.getPrivateKey();
                    const cryptedAESKey = parsedMessage.aesKeyCryptedRSA;

                    console.log("IV:", ivMessage);
                    console.log("Encrypted AES Key:", cryptedAESKey);

                    let decryptAESKey: string | null = null;
                    let decryptedMessage: string;

                    if (privateKey?.privateKey && privateKey.privateKey) {
                        try {
                            decryptAESKey = await RsaLib.cryptedToText(
                                cryptedAESKey,
                                atob(privateKey.privateKey)
                            );
                            console.log("Decrypted AES Key:", decryptAESKey);
                        } catch (err) {
                            console.error("Error decrypting RSA crypted AES Key: " + err);
                            return;
                        }

                        if (decryptAESKey !== null) {
                            try {
                                decryptedMessage = await AesLib.cryptedToText(
                                    parsedMessage.messageCryptedAES,
                                    ivMessage,
                                    decryptAESKey
                                );
                                console.log("Decrypted Message:", decryptedMessage);

                                setMessages(prev => [...prev, { from: parsedMessage.fromUsername, message: decryptedMessage }]);
                            } catch (err) {
                                console.error("Error decrypting message with decrypted AES key: ", err);
                                return;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Error on websocket's onmessage", err);
            }
        };

        socket.onclose = () => {
            setConnectionState(0)
            console.log("Disconnected");
        }

        socket.onerror = (err) => {
            console.error(err)
            setConnectionState(-1)
        }

    }, [room])

    const sendMessage = async () => {

        if (input.trim() !== "" && contactData.publicKey && userPublicKey) {
            try {
                let messageToSend = input;

                if (selectedLanguage !== "") {
                    const myHeaders = new Headers();
                    const jwtToken = await SwDb.getJwtToken();

                    myHeaders.append("Authorization", "Bearer " + jwtToken);
                    myHeaders.append("Content-Type", "application/json");

                    // TODO: crypt with the user service publickey before sending 
                    const raw = JSON.stringify({
                        "sentence": input,
                        "language": selectedLanguage
                    });

                    const response = await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/translate", {
                        method: "POST",
                        headers: myHeaders,
                        body: raw,
                        redirect: "follow"
                    });

                    const result = await response.json();
                    // TODO : check if != null before re-assigning
                    messageToSend = result.translated;
                }

                const messageHash = await sha256(messageToSend)

                // recup la clé public
                const contactPublicKeyPem = atob(contactData.publicKey);
                // recup la clé aes
                const contactAESKey = await AesLib.generateAESKey()
                // chiffrer le message en aes
                const aesCryptedMessageForContact = await AesLib.textToCrypted(messageToSend, contactAESKey)
                // chiffré la clé aes avec la clé public
                const contactAESKeyCryptedWithRSA = await RsaLib.textToCrypted(contactAESKey, contactPublicKeyPem)
                // formater le payload

                const formatedMessageReceiver = ChatLib.format({
                    fromUsername: username,
                    messageHash: messageHash,
                    messageCryptedAES: aesCryptedMessageForContact.encryptedData,
                    aesInitialValue: aesCryptedMessageForContact.iv,
                    aesKeyCryptedRSA: contactAESKeyCryptedWithRSA
                }, true) as MessagePayload;

                if (haveToSaveMessage) {
                    // recup la clé public
                    const currentUserPublicKeyPem = atob(userPublicKey);
                    // recup la clé aes
                    const currentUserAESKey = await AesLib.generateAESKey()
                    // chiffrer le message en aes
                    const aesCryptedMessageForCurrentUser = await AesLib.textToCrypted(messageToSend, currentUserAESKey)
                    // chiffré la clé aes avec la clé public
                    const currentUserAESKeyCryptedWithRSA = await RsaLib.textToCrypted(currentUserAESKey, currentUserPublicKeyPem)
                    // formater le payload

                    const formatedMessageSender = ChatLib.format({
                        fromUsername: username,
                        messageHash: messageHash,
                        messageCryptedAES: aesCryptedMessageForCurrentUser.encryptedData,
                        aesInitialValue: aesCryptedMessageForCurrentUser.iv,
                        aesKeyCryptedRSA: currentUserAESKeyCryptedWithRSA
                    }, true) as MessagePayload;

                    await saveMessages(
                        formatedMessageSender,
                        formatedMessageReceiver
                    )
                }

                ws.current?.send(JSON.stringify(formatedMessageReceiver));

                setMessages(prev => [...prev, { from: username, message: messageToSend }]);
                setInput("");
            } catch (e) {
                console.error("Encryption error:", e);
            }
        }
    }

    const saveMessages = async (
        formatedMessageForSender: MessagePayload,
        formatedMessageForReceiver: MessagePayload
    ) => {

        const jwtToken = await SwDb.getJwtToken()

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer " + jwtToken);

        console.log(formatedMessageForReceiver)
        console.log(formatedMessageForSender)

        const formatedMessageForReceiverStringify = btoa(JSON.stringify(formatedMessageForReceiver))
        const formatedMessageForSenderStringify = btoa(JSON.stringify(formatedMessageForSender))

        console.log(formatedMessageForReceiverStringify)
        console.log(formatedMessageForSenderStringify)

        const raw = JSON.stringify([
            {
                room: room,
                payload: formatedMessageForReceiverStringify,
                forWhom: contactData.id
            },
            {
                room: room,
                payload: formatedMessageForSenderStringify,
                forWhom: userId
            }
        ]);

        const requestOptions: RequestInit = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/messages", requestOptions)
            .then(async (response) => {
                const jsonResponse = await response.json()
                if (!response.ok) throw new Error(jsonResponse.message || "Erreur inconnue");
                return jsonResponse
            })
            .then(() => { })
            .catch((error) => {
                console.error(error)
            });
    }

    const showSavedMessage = async () => {
        if (!isSavedMessagesPrinted) {
            let cancelled = false;

            (async () => {
                try {
                    const jwtToken = await SwDb.getJwtToken();
                    const privateKey = await SwDb.getPrivateKey();

                    if (privateKey && privateKey.privateKey && jwtToken) {

                        const myHeaders = new Headers();
                        myHeaders.append("Authorization", "Bearer " + jwtToken);

                        const response = await fetch(
                            API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/messages/" + room,
                            {
                                method: "GET",
                                headers: myHeaders,
                                redirect: "follow"
                            }
                        );

                        if (!response.ok) {
                            throw new Error("Error during fetching saved messages")
                            toast.error("Error during fetching saved messages")
                            return;
                        };

                        const result = await response.json() as RecoverRegisteredMessage;
                        console.log(result)
                        if (cancelled) return;

                        const decryptedMessages: { from: string, message: string }[] = [];

                        for (const payloadString of result.messagesRegistered) {
                            console.log("Payload (Base64):", payloadString);
                            console.log("Payload (Decoded):", atob(payloadString));

                            const payload = JSON.parse(atob(payloadString)) as MessagePayload;
                            console.log("Parsed Payload:", payload);

                            let decryptAESKey: string | null = null;
                            let decryptedMessage: string | null = null;

                            try {
                                decryptAESKey = await RsaLib.cryptedToText(
                                    payload.aesKeyCryptedRSA,
                                    atob(privateKey.privateKey)
                                );
                                console.log("Decrypted AES Key:", decryptAESKey);
                            } catch (err: any) {
                                console.error("Error during decryption:", err.message);
                                console.log("Encrypted text:", payload.aesKeyCryptedRSA);
                                console.log("Private key (obfuscated):", privateKey.privateKey.substring(0, 50) + "...");
                            }

                            if (decryptAESKey !== null) {
                                try {
                                    decryptedMessage = await AesLib.cryptedToText(
                                        payload.messageCryptedAES,
                                        payload.aesInitialValue,
                                        decryptAESKey
                                    );
                                    console.log("Decrypted Message:", decryptedMessage);
                                } catch (err) {
                                    console.error("Error during decrypting AES crypted saved message:", err);
                                }
                            }

                            if (decryptedMessage !== null) decryptedMessages.push({
                                from: payload.fromUsername,
                                message: decryptedMessage
                            });
                        }

                        if (!cancelled && decryptedMessages.length > 0) setMessages(prev => [...prev, ...decryptedMessages]);
                        if (!cancelled) setIsSavedMessagePrint(true);
                    }

                } catch (error) {
                    console.error(error);
                    if (!cancelled) setIsSavedMessagePrint(true); // Marquer comme tenté même en cas d'erreur
                }
            })();

            return () => {
                cancelled = true;
            };
        }
    }

    useEffect(() => {
        console.log("Connecting to room:", room);
        connectWebSocket();

        return () => {
            ws.current?.close();
            if (reconnectInterval.current) {
                clearInterval(reconnectInterval.current);
            }
        };
    }, [room, connectWebSocket]);

    // Add new useEffect for reconnection logic
    useEffect(() => {

        if (connectionState === 0 && !reconnectInterval.current) {
            reconnectInterval.current = setInterval(() => {
                console.log("Attempting to reconnect...");
                connectWebSocket();
            }, 1000);
        }

        if (connectionState === 1 && inputRef.current) {
            setMessages([])
            showSavedMessage()
            inputRef.current.focus()
        } else {
            inputRef.current?.blur()
        }

        return () => {
            if (reconnectInterval.current) clearInterval(reconnectInterval.current);
        };

    }, [connectionState, connectWebSocket]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    return (
        <div className="flex flex-col h-[90vh] gap-3">

            <div className="flex items-center justify-between">
                <Button variant="secondary" size="icon" className="size-8" onClick={() => setContactData(null)}>
                    <ChevronLeftIcon />
                </Button>
                <h2 className="flex-auto flex flex-col text-xl font-semibold pl-3">
                    <div className="flex items-center gap-1">
                        {contactData.username}
                        <span className="text-xs">
                            {connectionState === 0 && " 🟠"}
                            {connectionState === 1 && ""}
                            {/* {connectionState === 1 && " 🟢"} */}
                            {connectionState === -1 && " 🔴"}
                        </span>
                    </div>
                    <span className="text-xs text-gray-500 italic">({contactData.uniqid})</span>
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto border rounded-md p-2 flex flex-col h-full">
                <div className="flex-1"></div>
                {messages.map((msg, index) => (
                    <div key={index}
                        className={`
                            mb-2 flex
                            ${msg.from === username ? "justify-end" : "justify-start"}
                        `}
                    >
                        <div className={`
                            text-gray-800 px-4 py-2 rounded-xl max-w-[66%] break-words shadow-sm
                            ${msg.from === username ?
                                "bg-gray-300 rounded-br-sm" :
                                "bg-blue-300 rounded-bl-sm"
                            }
                        `}>
                            <p className="text-sm leading-relaxed">
                                {msg.message}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            <div className="flex justify-between gap-2 items-center">
                <div className="flex items-center">
                    <Switch
                        id="checkBoxSaveMessage"
                        checked={haveToSaveMessage}
                        onCheckedChange={setHaveToSaveMessage}
                    />
                    <label htmlFor="checkBoxSaveMessage" className="pl-2 h-11 leading-[43px]">Save Message</label>
                </div>

                {showLanguageSelector && (
                    <select
                        value={selectedLanguage}
                        onChange={e => setSelectedLanguage(e.target.value)}
                        className="p-2 border rounded"
                    >
                        <option value="">Translate your messages</option>
                        <option value="french">Français</option>
                        <option value="english">English</option>
                        <option value="spanish">Español</option>
                        <option value="deutsch">Deutsch</option>
                        <option value="portuguese">Português</option>
                        <option value="italian">Italiano</option>
                        {/* dont supported for some reason, maybe utf8 or something like that
                        <option value="chinese">中文</option>
                        <option value="japanese">日本語</option>
                        <option value="korean">한국어</option>
                        <option value="russian">Русский</option>
                        <option value="arabic">العربية</option>
                        <option value="hindi">हिन्दी</option> */}
                    </select>
                )}
            </div>

            <div className="flex flex-col gap-2">

                <div className="flex gap-2 h-11">
                    <Input
                        ref={inputRef}
                        type="text"
                        value={input}
                        disabled={connectionState !== 1 && isSavedMessagesPrinted}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Write your message..."
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        className="h-full"
                    />
                    <Button
                        onClick={sendMessage} disabled={connectionState !== 1 && isSavedMessagesPrinted}
                        variant="outline" className="flex-[0 1 44px] h-full"
                        title="Send"
                    >
                        <Send />
                    </Button>
                </div>
            </div>
        </div>
    );
}

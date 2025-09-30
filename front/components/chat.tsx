"use client"
import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ChatLib, MessagePayload } from "@/lib/ChatLib";
import { RsaLib } from "@/lib/RsaLib";
import { SwDb } from "@/lib/SwDatabase";
import { AesLib } from "@/lib/AesLib";
import { ChevronLeftIcon } from "lucide-react";

export type ContactDataForChat = {
    id: string;
    username: string;
    uniqid: string;
    publicKey: string;
}

type ChatProps = {
    username: string;
    userId: string;
    contactData: ContactDataForChat;
    setContactData: (newContactData: ContactDataForChat | null) => void
};

function getApiProtocol() {
    return process.env.NODE_ENV === "development" ? "http" : "https";
}
function getWsProtocol() {
    return process.env.NODE_ENV === "development" ? "ws" : "wss";
}

export function Chat({ username, userId, contactData, setContactData }: ChatProps) {
    const [messages, setMessages] = useState<{ from: string; message: string; }[]>([])
    const ws = useRef<WebSocket | null>(null)
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const [input, setInput] = useState<string>("")
    const [connectionState, setConnectionState] = useState<number>(0)

    const [selectedLanguage, setSelectedLanguage] = useState<string>("");

    const showLanguageSelector = !!process.env.NEXT_PUBLIC_GPT_API_KEY;

    const room = ChatLib.getRoomName(userId, contactData.id)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        console.log("Connecting to room:", room);
        if (!room) return;
        const socket = new WebSocket(getWsProtocol() + "://" + process.env.NEXT_PUBLIC_MESSAGE_HOST + `/ws?room=${room}`);
        ws.current = socket;
        setMessages([]);

        socket.onopen = () => {
            setConnectionState(1)
            console.log("Connected");
        };

        socket.onmessage = async (event) => {
            try {
                const parsedMessage: MessagePayload = JSON.parse(event.data)
                const ivMessage = parsedMessage.aesInitialValue
                const privateKey = await SwDb.getPrivateKey();
                const cryptedAESKey = parsedMessage.aesKeyCryptedRSA
                
                // Ignore silently any crypto errors since it works
                let decryptAESKey, decryptedMessage;
                try {
                    decryptAESKey = await RsaLib.cryptedToText(
                        cryptedAESKey,
                        atob(privateKey?.privateKey || "")
                    );
                    decryptedMessage = await AesLib.cryptedToText(
                        parsedMessage.messageCryptedAES,
                        ivMessage,
                        decryptAESKey
                    )
                } catch (err) {
                    // Ignore crypto errors
                    return;
                }

                setMessages(prev => [...prev, { from: parsedMessage.fromUsername, message: decryptedMessage }]);
            } catch (err) {
                console.error("Message parsing error:", err);
            }
        }

        socket.onclose = () => {
            setConnectionState(0)
            console.log("Disconnected");
        };

        socket.onerror = (err) => {
            setConnectionState(-1)
        };

        return () => {
            socket.close();
        };

    }, [contactData, room]);

    const sendMessage = async () => {
        if (input.trim() !== "" && contactData.publicKey) {
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

                    const response = await fetch(getApiProtocol() + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/translate", {
                        method: "POST",
                        headers: myHeaders,
                        body: raw,
                        redirect: "follow"
                    });

                    const result = await response.json();
                    // TODO : check if != null before re-assigning
                    messageToSend = result.translated;
                }

                // recup la clé public
                const publicKeyPem = atob(contactData.publicKey);
                // recup la clé aes
                const AESKey = await AesLib.generateAESKey()
                // chiffrer le message en aes
                const aesCryptedMessage = await AesLib.textToCrypted(messageToSend, AESKey)
                // chiffré la clé aes avec la clé public
                const AESKeyCryptedWithRSA = await RsaLib.textToCrypted(AESKey, publicKeyPem)
                // formater le payload

                const formatedMessage = ChatLib.format({
                    fromUsername: username,
                    messageCryptedAES: aesCryptedMessage.encryptedData,
                    aesInitialValue: aesCryptedMessage.iv,
                    aesKeyCryptedRSA: AESKeyCryptedWithRSA
                });
                ws.current?.send(formatedMessage);

                setMessages(prev => [...prev, { from: "Me", message: messageToSend }]);
                setInput("");
            } catch (e) {
                console.error("Encryption error:", e);
            }
        }
    }

    return (
        <div className="flex flex-col h-[90vh]">
            <div className="mb-2 flex items-center justify-between">
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
                
                {showLanguageSelector && (
                    <select
                        value={selectedLanguage}
                        onChange={e => setSelectedLanguage(e.target.value)}
                        className="mb-2 p-2 border rounded"
                    >
                        <option value="">Language selection</option>
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

            <div className="flex-1 overflow-y-auto border rounded-md p-2 mb-4 flex flex-col">
                {messages.map((msg, index) => (
                    <div key={index} className={`
                        mb-1 text-sm text-gray-800 p-3 
                        ${msg.from === "Me" ?
                            "self-end text-right bg-gray-300 [border-radius:5px_5px_0_5px]" :
                            "self-start text-left bg-blue-300 [border-radius:5px_5px_5px_0px]"
                        }
                    `}>
                        {/* <span className="font-semibold">{msg.from}:</span>  */}
                        {msg.message}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            <div className="flex gap-2">
                <Input
                    type="text"
                    value={input}
                    disabled={connectionState !== 1}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Écris ton message..."
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button onClick={sendMessage} disabled={connectionState !== 1} >Envoyer</Button>
            </div>
        </div>
    );
}

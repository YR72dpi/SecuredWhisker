"use client"
import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ChatLib } from "@/lib/ChatLib";
import { Crypto } from "@/lib/Crypto";
import { SwDb } from "@/lib/SwDatabase";

type ChatProps = {
    username: string;
    room: string;
    contactPublicKey?: string;
};

export function Chat({ username, room, contactPublicKey }: ChatProps) {
    const [messages, setMessages] = useState<{ from: string; message: string; }[]>([])
    const ws = useRef<WebSocket | null>(null)
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const [input, setInput] = useState<string>("")
    const [connectionState, setConnectionState] = useState<number>(0)

    const [selectedLanguage, setSelectedLanguage] = useState<string>("");

    const showLanguageSelector = !!process.env.NEXT_PUBLIC_GPT_API_KEY;

    useEffect(() => {
        console.log("Connecting to room:", room);
        if (!room) return;
        const socket = new WebSocket(`ws://localhost:8080/ws?room=${room}`);
        ws.current = socket;
        setMessages([]);

        socket.onopen = () => {
            setConnectionState(1)
            console.log("Connected");
        };

        socket.onmessage = async (event) => {

            const parsedMessage = JSON.parse(event.data)

            const privateKey = await SwDb.getPrivateKey();
            // console.log(atob(privateKey?.privateKey || ""));
            const decryptedMessage = await Crypto.cryptedToText(
                parsedMessage.message,
                atob(privateKey?.privateKey || "")
            );


            // ajout a Messages
            // afficher les miens

            setMessages(prev => [...prev, { from: parsedMessage.from, message: decryptedMessage }]);
        };

        socket.onclose = () => {
            setConnectionState(0)
            console.log("Disconnected");
        };

        socket.onerror = (err) => {
            setConnectionState(-1)
            console.error("Erreur WebSocket :", err);
        };

        return () => {
            socket.close();
        };

    }, [room, contactPublicKey]);

    const sendMessage = async () => {
        if (input.trim() !== "" && contactPublicKey) {
            try {
                let messageToSend = input;

                if (selectedLanguage !== "") {
                    const myHeaders = new Headers();
                    const jwtToken = await SwDb.getJwtToken();

                    myHeaders.append("Authorization", "Bearer " + jwtToken);
                    myHeaders.append("Content-Type", "application/json");

                    const raw = JSON.stringify({
                        "sentence": input,
                        "language": selectedLanguage
                    });

                    const response = await fetch("http://localhost:4000/api/protected/translate", {
                        method: "POST",
                        headers: myHeaders,
                        body: raw,
                        redirect: "follow"
                    });

                    const result = await response.json();
                    messageToSend = result.translated;
                }

                const publicKeyPem = atob(contactPublicKey);
                const cryptedMessage = await Crypto.textToCrypted(messageToSend, publicKeyPem);
                const formatedMessage = ChatLib.format(username, cryptedMessage);
                ws.current?.send(formatedMessage);

                setMessages(prev => [...prev, { from: username, message: messageToSend }]);
                setInput("");
            } catch (e) {
                console.error("Erreur de chiffrement :", e);
            }
        }
    }

    return (
        <div className="flex flex-col h-full p-4">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xl font-semibold mb-2">
                    Chat to {username}
                    {connectionState === 0 && " 🟠"}
                    {connectionState === 1 && " 🟢"}
                    {connectionState === -1 && " 🔴"}
                </h2>

                {showLanguageSelector && (
                     <select
                    value={selectedLanguage}
                    onChange={e => setSelectedLanguage(e.target.value)}
                    className="mb-2 p-2 border rounded"
                >
                    <option value="">Choice a language</option>
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
                    <option value="Reunionese Creole">Réunion Creole</option>
                    {/* Ajoute d'autres langues ici */}
                </select>
                )}
               
            </div>

            <div className="flex-1 overflow-y-auto border rounded-md p-2 mb-4 bg-gray-100">
                {messages.map((msg, index) => (
                    <div key={index} className="mb-1 text-sm text-gray-800">
                        <span className="font-semibold">{msg.from}:</span> {msg.message}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            <div className="flex gap-2">
                <Input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Écris ton message..."
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button onClick={sendMessage}>Envoyer</Button>
            </div>
        </div>
    );
}

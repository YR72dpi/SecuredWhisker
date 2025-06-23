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
                const publicKeyPem = atob(contactPublicKey);
                console.log(publicKeyPem);
                const cryptedMessage = await Crypto.textToCrypted(input, publicKeyPem);
                const formatedMessage = ChatLib.format(username, cryptedMessage);
                ws.current?.send(formatedMessage);

                setMessages(prev => [...prev, { from: username, message: input }]);
                setInput("");
            } catch (e) {
                console.error("Erreur de chiffrement :", e);
            }
        }
    }

    return (
        <div className="flex flex-col h-full p-4">
            <h2 className="text-xl font-semibold mb-2">
                Chat to {username}
                {connectionState === 0 && " 🟠"}
                {connectionState === 1 && " 🟢"}
                {connectionState === -1 && " 🔴"}
            </h2>

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

"use client"
import { useEffect, useRef, useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ChatFormater } from "@/lib/ChatFormater";

type ChatProps = {
    username: string;
};


export function Chat({ username }: ChatProps) {
    const [messages, setMessages] = useState<{ from: string; message: string; }[]>([])
    const ws = useRef<WebSocket | null>(null)
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const [input, setInput] = useState<string>("")
    const [connectionState, setConnectionState] = useState<number>(0)
    
    useEffect(() => {
        const roomName = "12";
        const socket = new WebSocket(`ws://localhost:8080/ws?room=${roomName}`);
        ws.current = socket;

        socket.onopen = () => {
            setConnectionState(1)
            console.log("Connected");
        };

        socket.onmessage = (event) => {
            console.log("Received message:", event.data);
            setMessages(prev => [...prev, JSON.parse(event.data)]);
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
        
    }, []);

    const sendMessage = () => {
        if (input.trim() !== "") {

            const formatedMessage = ChatFormater.format(username, input)

            ws.current?.send(formatedMessage);
            // setMessages(prev => [...prev, "Moi : " + input]);
            setInput("");
        }
    };

    return (
        <div className="flex flex-col h-full p-4">
            <h2 className="text-xl font-semibold mb-2">
                Chat 
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

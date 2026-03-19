
export type MessagePayloadParams = {
    fromUsername: string
    messageHash: string,
    messageCryptedAES : string,
    aesInitialValue: string,
    aesKeyCryptedRSA : string
}

export type MessagePayload = {
    fromUsername: string,
    dateTime: Date,
    messageHash: string,
    messageCryptedAES : string,
    aesInitialValue: string,
    aesKeyCryptedRSA : string
}

export type ReceiverDataForChat = {
    id: string;
    username: string;
    uniqid: string;
    publicKey: string;
    notificationPayload: string[]
}

export type SenderDataForChat = {
    id: string;
    username: string;
    publicKey: string
}

export type ChatProps = {
    senderDataForChat: SenderDataForChat
    receiverDataForChat: ReceiverDataForChat;
    setContactData: (newContactData: ReceiverDataForChat | null) => void
};

export type RecoverRegisteredMessage = {
    message: string
    messagesRegistered: string[]
    server_time: string
}

export class ChatLib {

    static format(payload: MessagePayloadParams, returnObject: boolean = false) : MessagePayload|string {

        const payloadObject : MessagePayload = {
            fromUsername: payload.fromUsername,
            messageHash: payload.messageHash,
            dateTime: (new Date()),
            messageCryptedAES: payload.messageCryptedAES,
            aesInitialValue: payload.aesInitialValue,
            aesKeyCryptedRSA : payload.aesKeyCryptedRSA
        }

        return returnObject ? payloadObject : JSON.stringify(payloadObject)
    }

    
    static dateTimeFormat = (dateTimeIso: string): string => {
            const date = new Date(dateTimeIso);
    
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
    
            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
    
            // Convertir en format 12h avec am/pm
            const ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // 0 → 12
    
            const formatted = `${day}/${month}/${year} ${hours}:${minutes}${ampm}`;
    
            return formatted
        }

    // TODO : make the room name less guessable
    static getRoomName(id1: string, id2: string) {
        return [id1, id2].sort().join("");
    }
}
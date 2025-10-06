
export type MessagePayloadParams = {
    fromUsername: string
    messageCryptedAES : string,
    aesInitialValue: string,
    aesKeyCryptedRSA : string
}

export type MessagePayload = {
    fromUsername: string,
    dateTime: Date
    messageCryptedAES : string,
    aesInitialValue: string,
    aesKeyCryptedRSA : string
}

export class ChatLib {

    static format(payload: MessagePayloadParams) : string {

        const payloadObject : MessagePayload = {
            fromUsername: payload.fromUsername,
            dateTime: (new Date()),
            messageCryptedAES: payload.messageCryptedAES,
            aesInitialValue: payload.aesInitialValue,
            aesKeyCryptedRSA : payload.aesKeyCryptedRSA
        }

        return JSON.stringify(payloadObject)
    }

    // TODO : make the room name less guessable
    static getRoomName(id1: string, id2: string) {
        return [id1, id2].sort().join("");
    }
}
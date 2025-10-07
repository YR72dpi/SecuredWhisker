
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

    // TODO : make the room name less guessable
    static getRoomName(id1: string, id2: string) {
        return [id1, id2].sort().join("");
    }
}
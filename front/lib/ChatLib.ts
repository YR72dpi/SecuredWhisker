
export type MessagePayload = {
    fromUsername: string
    messageCryptedAES : string,
    aesInitialValue: string,
    aesKeyCryptedRSA : string
}

export class ChatLib {

    static format(payload: MessagePayload) {
        return JSON.stringify({
            fromUsername: payload.fromUsername,
            messageCryptedAES: payload.messageCryptedAES,
            aesInitialValue: payload.aesInitialValue,
            aesKeyCryptedRSA : payload.aesKeyCryptedRSA
        })
    }

    static getRoomName(id1: string, id2: string) {
        return [id1, id2].sort().join("");
    }
}
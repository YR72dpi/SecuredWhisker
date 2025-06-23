
export class ChatLib {
    static format(username: string, message: string) {
        return JSON.stringify({
            from: username,
            message: message
        })
    }


    static getRoomName(id1: string, id2: string) {
        return [id1, id2].sort().join("");
    }
}

export class ChatFormater {
    static format (username: string, message : string) {
        return JSON.stringify({
            from: username,
            message: message
        })
    }
}
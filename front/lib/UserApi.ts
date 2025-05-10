export type SubscribeResponse = {
    ok: boolean
    message: string
    server_time: string
}

export type LoginResponse = {
    ok: string,
    message: string,
    user: null|string,
    token: string,
    server_time: string
}

export class UserApi {
    static async getApiPublicKey () {
        const data = await fetch("http://localhost:4000/api/publicKey")
        .then((response) => response.json())
        .then((result) => result)
        .catch((error) => console.error(error));
        return atob(data.publicKey);
    }

    static async subscribe (userData: {username: string, password: string, publicKey: string}): Promise<SubscribeResponse> {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify(userData);

        try {
            const request = await fetch(
                "http://localhost:4000/api/user/subscribe", 
                {
                    method: "POST",
                    headers: myHeaders,
                    body: raw,
                    redirect: "follow"
                })
            .then((response) => response.json())
            .then((result) => result)
            .catch((error) => console.error(error));
            
            return request

        } catch (error) {
            throw error
        }
    }

    static async login (userData: {username: string, password: string}): Promise<LoginResponse> {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify(userData);

        try {
            const request = await fetch(
                "http://localhost:4000/api/user/login", 
                {
                    method: "POST",
                    headers: myHeaders,
                    body: raw,
                    redirect: "follow"
                })
            .then((response) => response.json())
            .then((result) => result)
            .catch((error) => console.error(error));
            
            return request

        } catch (error) {
            throw error
        }
    }
}
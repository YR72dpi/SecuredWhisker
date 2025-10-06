import { API_PROTOCOL } from "./NetworkProtocol"

export type SubscribeResponse = {
    ok: boolean
    message: string
    server_time: string
}

export type LoginResponse = {
    ok: string,
    message: string,
    user: null | string,
    token: string,
    server_time: string
}

export class UserApi {
    static async getApiPublicKey() {
        try {
            const response = await fetch(`${API_PROTOCOL}://${process.env.NEXT_PUBLIC_USER_HOST}/api/publicKey`);
            if (!response.ok) throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);

            const data = await response.json();
            if (!data || typeof data.publicKey !== 'string') throw new Error('Invalid response format: publicKey missing or invalid');

            const publicKey = atob(data.publicKey);
            if (!publicKey.trim()) throw new Error('Received public key is empty');
            if (!publicKey.includes("BEGIN PUBLIC KEY")) throw new Error('Public key does not includes "begin public key"');

            try {
                return publicKey;
            } catch (decodeError) {
                throw new Error('Error decoding base64 public key');
            }

        } catch (error) {
            console.error('Error fetching API public key:', error);
            throw error;
        }
    }

    static async subscribe(userData: { username: string, password: string, publicKey: string }): Promise<SubscribeResponse> {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify(userData);

        try {
            const request = await fetch(
                API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/user/subscribe",
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

    static async login(userData: { username: string, password: string }): Promise<LoginResponse> {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify(userData);

        try {
            const request = await fetch(
                API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/user/login",
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
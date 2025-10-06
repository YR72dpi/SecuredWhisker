import { API_PROTOCOL } from "./NetworkProtocol";
import { SwDb } from "./SwDatabase";

export class JwtTokenLib {

    static async isValidJwtToken(): Promise<string | boolean> {

        const jwtToken = await SwDb.getJwtToken()
        if (!jwtToken) { return false }

        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + jwtToken);

        const requestOptions: RequestInit = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        };

        return await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfUserData", requestOptions)
            .then((response) => {
                if (!response.ok) return false
                return response.json();
            })
            .then((result) => {
                if (result?.identifier) {
                    return jwtToken
                } else {
                    return false;
                }
            })
            .catch((error) => {
                console.error(error);
                return false;
            });
    }
}
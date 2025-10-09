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

        const link = API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/user/validJwtToken"

        return await fetch(link, requestOptions)
            .then((response) => {
                if (!response.ok) return false
                return response.json();
            })
            .then((result) => {
                if (result?.isConnectable) {
                    return jwtToken
                } else {
                    return false;
                }
            })
            .catch((error) => {
                console.error("Error during fetching jwt token" + error);
                return false;
            });
    }
}
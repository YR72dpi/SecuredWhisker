import { API_PROTOCOL } from "./NetworkProtocol";
import { SwDb } from "./SwDatabase";

export class JwtTokenLib {

    static async getValidatedJwtTokenOrRedirect(redirect: boolean|null = null): Promise<string | null> {
        const jwtToken = await SwDb.getJwtToken()
        if (!jwtToken && redirect) { window.location.replace("/"); return null }

        const myHeaders = new Headers();
        myHeaders.append("Authorization", "Bearer " + jwtToken);

        const requestOptions: RequestInit = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        };

        await fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfUserData", requestOptions)
            .then((response) => {
                if (!response.ok) {
                    if (redirect) window.location.replace("/");
                    return null;
                }
                return response.json();
            })
            .then((result) => {
                if (!result?.identifier) {
                    if (redirect) window.location.replace("/");
                    return null;
                }
            })
            .catch((error) => {
                console.error(error);
                if (redirect) window.location.replace("/");
                return null;
            });

        return jwtToken
    }
}
export class UserApi {
    static async getApiPublicKey () {
        const data = await fetch("http://localhost:4000/api/publicKey")
        .then((response) => response.json())
        .then((result) => result)
        .catch((error) => console.error(error));
        return atob(data.publicKey);
    }

    static async subscribe (userData: {username: string, password: string, publicKey: string}) {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify(userData);

        fetch(
            "http://localhost:4000/api/user/subscribe", 
            {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow"
            })
        .then((response) => response.text())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));
    }
}
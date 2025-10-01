"use client"
import { HomeHeader } from "@/components/HomeHeader";
import Image from "next/image";
import { useEffect } from "react";
import { SwDb } from "@/lib/SwDatabase";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";

export default function Home() {
  useEffect(() => {
    (async () => {
      const jwtToken = await SwDb.getJwtToken();
      if (!jwtToken) return;

      const myHeaders = new Headers();
      myHeaders.append("Authorization", "Bearer " + jwtToken);

      const requestOptions: RequestInit = {
        method: "GET",
        headers: myHeaders,
        redirect: "follow",
      };

      fetch(API_PROTOCOL + "://" + process.env.NEXT_PUBLIC_USER_HOST + "/api/protected/selfUserData", requestOptions)
        .then((response) => {
          if (response.ok) window.location.replace("/chat");
        })
        .catch(() => {});
    })();
  }, []);

  return (
    <>
      <div className="flex flex-col pt-12 items-center h-[90vh] font-[family-name:var(--font-geist-sans)]">
        <HomeHeader title="Secured Whisker" />

        <a
          href="https://github.com/YR72dpi/SecuredWhisker2.0"
          className="fixed bottom-5 flex gap-1"
        >
          Secured Whisker{" "}
          <Image
            alt="new tab"
            src={"/icons/newTab.svg"}
            width={20}
            height={20}
          />
        </a>
      </div>
    </>
  );
}

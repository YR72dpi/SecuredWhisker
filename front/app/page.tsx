"use client"
import { HomeHeader } from "@/components/HomeHeader";
import Image from "next/image";
import { useEffect, useState } from "react";
import { SwDb } from "@/lib/SwDatabase";
import { API_PROTOCOL } from "@/lib/NetworkProtocol";
import { JwtTokenLib } from "@/lib/JwtTokenLib";

export default function Home() {
  const [canShowPage, setCanShowPage] = useState<boolean>(false)

  useEffect(() => {
    (async () => {

      const jwtToken = await JwtTokenLib.getValidatedJwtTokenOrRedirect()
      if (jwtToken) window.location.replace("/chat");
      else setCanShowPage(true)
      
    })();
  }, []);

  return (
    canShowPage && (
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
    )
  )
}

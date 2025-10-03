"use client"
import { HomeHeader } from "@/components/HomeHeader";
import Image from "next/image";

export default function Home() {

  return (
    <>
      <div className="flex flex-col pt-12 items-center h-[90vh] font-[family-name:var(--font-geist-sans)]">
        <header className="m-6 p-3 w-full flex flex-col items-center">
          <h1 className="mb-4 text-4xl font-extrabold">Secured Whisker</h1>
        </header>
        <p>Access denied </p>
        <p>Contact the administrator to obtain access</p>
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

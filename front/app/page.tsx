import { HomeHeader } from "@/components/HomeHeader";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <div className="flex flex-col pt-12 items-center h-[90vh] font-[family-name:var(--font-geist-sans)]">
        <HomeHeader title="Secured Whisker"/>

        <a href="https://github.com/YR72dpi/SecuredWhisker2.0" className="fixed bottom-5 flex gap-1">
          Secured Whisker <Image alt="new tab" src={'/icons/newTab.svg'} width={20} height={20} />
        </a>
      </div>
    </>
  );
}

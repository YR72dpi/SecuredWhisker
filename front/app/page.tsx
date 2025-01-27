import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center h-screen font-[family-name:var(--font-geist-sans)]">
      <h1 className="mb-4 text-4xl font-extrabold">Secured Whisker</h1>
      <nav>
        <ul className="tw-nav">
          <li><a href="/login">Login</a></li> 
          <span>|</span>
          <li><a href="/signin">Sign in</a></li>
        </ul>
      </nav>
      <a href="https://github.com/YR72dpi/SecuredWhisker2.0" className="fixed bottom-5 flex gap-1">
        Secured Whisker <Image alt="new tab" src={'/icons/newTab.svg'} width={20} height={20} />
      </a>
    </div>
  );
}

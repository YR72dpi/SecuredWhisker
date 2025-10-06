"use client"

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
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>
        </a>
      </div>
    </>
  );
}

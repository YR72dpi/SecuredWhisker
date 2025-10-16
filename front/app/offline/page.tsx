export default function OfflinePage() {
  return (
      <>
        <div className="flex flex-col pt-12 items-center h-[90vh] font-[family-name:var(--font-geist-sans)] gap-4">
          <header className="m-6 p-3 w-full flex flex-col items-center">
                <h1 className="text-4xl font-extrabold">Secured Whisker</h1>
            </header>
          <p className="text-3xl">You&apos;re offline ! 😭</p>
          <p>That&apos;s a shame, find a connection and come back. </p>
        </div>
      </>
    )
}

export const metadata = {
  title: 'Offline',
  description: "You're offline, see you later ?",
};
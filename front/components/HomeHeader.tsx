'use client'
import Link from "next/link"
import { usePathname } from "next/navigation"

type HomeHeaderProps = {
    title: string
}

export const HomeHeader = ({title}: HomeHeaderProps) => {
    const pathname = usePathname()
    return (
        <>
            <header className="m-6 p-3 w-full flex flex-col items-center">
                <h1 className="mb-4 text-4xl font-extrabold">{title}</h1>
                <nav>
                    <ul className="tw-nav">
                        {pathname !== '/' && (
                            <>
                                <li><Link href="/" className="p-3">Home</Link></li> |
                            </>
                        )}
                        <li><Link href="/login" className="p-3">Login</Link></li> |
                        <li><Link href="/signin" className=" p-3">Sign in</Link></li>
                    </ul>
                </nav>
            </header>
        </>
    )
}
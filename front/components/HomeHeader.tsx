'use client'
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
                                <li><a href="/" className="p-3">Home</a></li> |
                            </>
                        )}
                        <li><a href="/login" className="p-3">Login</a></li> |
                        <li><a href="/signin" className=" p-3">Sign in</a></li>
                    </ul>
                </nav>
            </header>
        </>
    )
}
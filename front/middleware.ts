// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ALLOWED_IPS = process.env.NEXT_PUBLIC_IP_WHITELIST ?? ""

export function middleware(request: NextRequest) {
    const ip = request.ip ||
        request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        'unknown'

    const isAllowedIp = !ALLOWED_IPS.split(",").includes(ip)

    console.log("\n")
    console.log("========== White List Middleware ==========")
    console.log("Authorised IP address: \t" + (ALLOWED_IPS === "" ? "All" : ALLOWED_IPS))
    console.log("Incoming IP: \t\t" + ip)
    console.log("Is authorised: \t\t" + (isAllowedIp ? "Yes" : "No"))
    console.log("===========================================")
    console.log("\n")

    if (ALLOWED_IPS === "") return NextResponse.next()
    if (isAllowedIp) return NextResponse.rewrite(new URL('/accessDenied', request.url))
    // access denied, contact the administrator to obtain access

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
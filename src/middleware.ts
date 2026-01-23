import { NextRequest, NextResponse } from 'next/server'

const WHITELIST = ['s', 'g', 'p']

export function middleware(req: NextRequest) {
    const url = req.nextUrl

    // Ignorer assets / API / fichiers statiques
    if (
        url.pathname.startsWith('/_next') ||
        url.pathname.startsWith('/api') ||
        url.pathname.includes('.')
    ) {
        return NextResponse.next()
    }

    const originalParams = url.searchParams
    const cleanParams = new URLSearchParams()

    let needsRedirect = false

    for (const [key, value] of originalParams.entries()) {
        if (WHITELIST.includes(key)) {
            cleanParams.set(key, value)
        } else {
            needsRedirect = true
        }
    }

    // Redirect to canonical URL if we found unexpected queryparams
    if (needsRedirect) {
        const redirectUrl = new URL(url.pathname, req.url)
        redirectUrl.search = cleanParams.toString()
        return NextResponse.redirect(redirectUrl, 308)
    }

    return NextResponse.next()
}

import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'

function mockRequest(url: string) {
    return new NextRequest(url)
}

describe('Middleware whitelist', () => {
    it('does not redirect legit requests', async () => {
        const req = mockRequest('https://myurl/rechercher?s=chat&g=true&p=false')
        const res = await middleware(req)
        expect(res?.status).toBe(200)
    })

    it('redirects if an unexpected query param pops up', async () => {
        const req = mockRequest('https://myurl/rechercher?s=chat&foo=bar')
        const res = await middleware(req)
        expect(res?.status).toBe(308)
        expect(res?.headers.get('location')).toBe('https://myurl/rechercher?s=chat')
    })

    it('removes several unexpected query params', async () => {
        const req = mockRequest('https://myurl/rechercher?foo=bar&baz=123&s=test')
        const res = await middleware(req)
        expect(res?.status).toBe(308)
        expect(res?.headers.get('location')).toBe('https://myurl/rechercher?s=test')
    })

    it('ignores assets', async () => {
        const req = mockRequest('https://myurl/_next/static/file.js?_rsc=bad')
        const res = await middleware(req)
        expect(res?.status).toBe(200)
    })
})

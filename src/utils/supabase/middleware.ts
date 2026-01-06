import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // ROUTE PROTECTION
    const path = request.nextUrl.pathname;

    // 1. Admin/Logistica routes require auth
    if (path.startsWith('/admin') || path.startsWith('/logistica')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
    }

    // 2. Auth pages (login) redirect to dashboard if logged in
    if (path === '/login' && user) {
        const url = request.nextUrl.clone()
        // Default to logistica plan, logic can be smarter based on role
        url.pathname = '/admin/logistics/itineraries'
        return NextResponse.redirect(url)
    }

    return response
}

import { type NextRequest, NextResponse } from 'next/server'

// This proxy checks if the user is authenticated.
export function proxy(request: NextRequest) {
  // Development mode: Bypassing authentication.
  return NextResponse.next();

  /*
  const isAuthenticated = request.cookies.has('chefcito-auth');
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  if (isLoginPage) {
    // If the user is authenticated and tries to access the login page,
    // redirect them to the POS page.
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/pos', request.url));
    }
    // Otherwise, allow access to the login page.
    return NextResponse.next();
  }

  // If the user is not authenticated and trying to access a protected page,
  // redirect them to the login page.
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If the user is authenticated, allow access to the requested page.
  return NextResponse.next()
  */
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
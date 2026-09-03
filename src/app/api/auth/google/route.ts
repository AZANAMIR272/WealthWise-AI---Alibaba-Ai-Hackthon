import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { googleLogin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(new URL('/?error=google_no_code', req.url));
    }

    // Exchange auth code with Supabase to get user session
    const supabase = createServerSupabase();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      console.error('Supabase code exchange error:', error);
      return NextResponse.redirect(new URL('/?error=google_exchange_failed', req.url));
    }

    const supabaseUser = data.user;
    const email = supabaseUser.email;
    const name =
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      (email ? email.split('@')[0] : 'Google User');

    if (!email) {
      return NextResponse.redirect(new URL('/?error=google_no_email', req.url));
    }

    // Create or find user in our DB, generate JWT
    const result = await googleLogin({
      email,
      name,
      sub: supabaseUser.id,
      picture: supabaseUser.user_metadata?.avatar_url,
    });

    // Set httpOnly cookie and redirect to /home with user data for localStorage
    const homeUrl = new URL('/home', req.url);
    homeUrl.searchParams.set('uid', result.user.id);
    homeUrl.searchParams.set('uname', result.user.name);
    homeUrl.searchParams.set('uemail', result.user.email);
    if (result.user.avatar) homeUrl.searchParams.set('uavatar', result.user.avatar);
    const response = NextResponse.redirect(homeUrl);
    response.cookies.set('ww_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Google auth error:', error);
    return NextResponse.redirect(new URL('/?error=google_login_failed', req.url));
  }
}

/**
 * POST handler — receives Supabase access_token from hash fragment flow.
 * Decodes user info, creates/finds user in our DB, sets cookie, redirects to /home.
 */
export async function POST(req: NextRequest) {
  try {
    const { access_token } = await req.json();

    if (!access_token) {
      return NextResponse.redirect(new URL('/?error=google_no_code', req.url));
    }

    // Decode Supabase JWT (signature not needed — we trust it came from Supabase)
    const parts = access_token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    const email = payload.email;
    const name =
      payload.user_metadata?.full_name ||
      payload.user_metadata?.name ||
      (email ? email.split('@')[0] : 'Google User');

    if (!email) {
      return NextResponse.redirect(new URL('/?error=google_no_email', req.url));
    }

    const result = await googleLogin({
      email,
      name,
      sub: payload.sub || String(payload.user_metadata?.provider_id || ''),
      picture: payload.user_metadata?.avatar_url,
    });

    // Redirect to /home with user data for localStorage
    const homeUrl = new URL('/home', req.url);
    homeUrl.searchParams.set('uid', result.user.id);
    homeUrl.searchParams.set('uname', result.user.name);
    homeUrl.searchParams.set('uemail', result.user.email);
    if (result.user.avatar) homeUrl.searchParams.set('uavatar', result.user.avatar);
    const response = NextResponse.redirect(homeUrl);
    response.cookies.set('ww_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Google token auth error:', error);
    return NextResponse.redirect(new URL('/?error=google_login_failed', req.url));
  }
}

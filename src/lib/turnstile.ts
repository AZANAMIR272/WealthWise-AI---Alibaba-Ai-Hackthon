// Server-side Cloudflare Turnstile token verification
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileResult {
  success: boolean;
  error: string | null;
}

export async function verifyTurnstileToken(token: string | undefined, ip?: string): Promise<TurnstileResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    // No secret key configured — skip verification in dev if explicitly disabled
    if (process.env.NODE_ENV === 'development' && !process.env.TURNSTILE_SECRET_KEY) {
      return { success: true, error: null };
    }
    return { success: false, error: 'CAPTCHA verification is not configured on the server' };
  }

  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { success: false, error: 'Please complete the CAPTCHA challenge before continuing' };
  }

  try {
    const body: Record<string, string> = {
      secret: secretKey,
      response: token,
    };
    if (ip) body.remoteip = ip;

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Turnstile API error:', res.status, data);
      return { success: false, error: 'CAPTCHA verification service is temporarily unavailable. Please try again.' };
    }

    if (!data.success) {
      const errorCodes: string[] = data['error-codes'] || [];
      // Map Cloudflare error codes to user-friendly messages
      if (errorCodes.includes('timeout-or-duplicate') || errorCodes.includes('timeout')) {
        return { success: false, error: 'CAPTCHA challenge expired. Please complete it again.' };
      }
      if (errorCodes.includes('invalid-input-response') || errorCodes.includes('invalid-input-secret')) {
        return { success: false, error: 'CAPTCHA verification failed. Please try again.' };
      }
      if (errorCodes.includes('missing-input-response') || errorCodes.includes('missing-input-secret')) {
        return { success: false, error: 'CAPTCHA verification is misconfigured. Please contact support.' };
      }
      if (errorCodes.includes('bad-request')) {
        return { success: false, error: 'Invalid CAPTCHA request. Please try again.' };
      }
      return { success: false, error: 'CAPTCHA verification failed. Please try again.' };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Turnstile fetch error:', err.message);
    return { success: false, error: 'Could not reach CAPTCHA verification service. Please try again.' };
  }
}

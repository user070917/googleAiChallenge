import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${req.nextUrl.origin}/api/auth/email/gmail/callback`;

  let emailAddress = 'simulation-user@gmail.com';
  let refreshToken = 'mock_refresh_token';

  if (clientId && clientSecret && code && code !== 'mock_auth_code') {
    // Real OAuth exchange flow
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code for tokens');
      }

      const tokens = await tokenResponse.json();
      const accessToken = tokens.access_token;
      refreshToken = tokens.refresh_token || refreshToken;
      
      // Fetch user profile to get email address
      const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (userinfoResponse.ok) {
        const userInfo = await userinfoResponse.json();
        emailAddress = userInfo.email || emailAddress;
      }
    } catch (err) {
      console.error('OAuth Callback token exchange error:', err);
      return NextResponse.redirect(`${req.nextUrl.origin}/settings?linked=error`);
    }
  }

  // Save to Supabase database if configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // First clean up any existing connection for this provider
      await supabase.from('email_connections').delete().eq('provider', 'gmail');
      
      // Insert new connection
      const { error } = await supabase.from('email_connections').insert([{
        provider: 'gmail',
        email_address: emailAddress,
        refresh_token: refreshToken || null,
        created_at: new Date().toISOString(),
        last_synced_at: '방금 전'
      }]);
      
      if (error) {
        console.error('Supabase connection save error:', error);
      }
    } catch (dbErr) {
      console.error('Database operations error in OAuth Callback:', dbErr);
    }
  }

  // Redirect to Settings page with success parameters
  let redirectUrl = `${req.nextUrl.origin}/settings?linked=success&provider=gmail&email=${encodeURIComponent(emailAddress)}`;
  if (refreshToken) {
    redirectUrl += `&refresh_token=${encodeURIComponent(refreshToken)}`;
  }
  return NextResponse.redirect(redirectUrl);
}

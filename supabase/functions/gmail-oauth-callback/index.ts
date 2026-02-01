import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return new Response(generateHtml('Erro', `Autorização negada: ${error}`), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (!code || !state) {
      return new Response(generateHtml('Erro', 'Parâmetros inválidos'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const { userId, returnTo } = JSON.parse(decodeURIComponent(state));

    const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
    const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${SUPABASE_URL}/functions/v1/gmail-oauth-callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange error:', errorText);
      return new Response(generateHtml('Erro', 'Falha ao obter tokens'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const tokens = await tokenResponse.json();

    // Get user email from Gmail API
    const profileResponse = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileResponse.ok) {
      return new Response(generateHtml('Erro', 'Falha ao obter perfil do Gmail'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const profile = await profileResponse.json();

    // Save tokens to database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    const { error: upsertError } = await supabase
      .from('pz_gmail_tokens')
      .upsert({
        user_id: userId,
        email: profile.emailAddress,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokenExpiry.toISOString(),
      }, {
        onConflict: 'user_id,email'
      });

    if (upsertError) {
      console.error('Database error:', upsertError);
      return new Response(generateHtml('Erro', 'Falha ao salvar credenciais'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response(generateHtml('Sucesso!', `Gmail conectado: ${profile.emailAddress}`, true, returnTo), {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Callback error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(generateHtml('Erro', message), {
      headers: { 'Content-Type': 'text/html' },
    });
  }
});

function generateHtml(title: string, message: string, success = false, returnTo?: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - PRAZO ZERO</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: rgba(255,255,255,0.1);
      border-radius: 1rem;
      backdrop-filter: blur(10px);
      max-width: 400px;
    }
    .icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 2.5rem;
    }
    .success { background: #22c55e; }
    .error { background: #ef4444; }
    h1 { margin-bottom: 1rem; }
    p { opacity: 0.9; margin-bottom: 1.5rem; }
    .btn {
      background: #3b82f6;
      color: #fff;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
    }
    .btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon ${success ? 'success' : 'error'}">
      ${success ? '✓' : '✕'}
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <button class="btn" onclick="window.close(); window.opener && window.opener.location.reload();">
      Fechar
    </button>
  </div>
  <script>
    // Se foi aberto em popup, sinaliza a janela mãe
    setTimeout(() => {
      if (window.opener) {
        window.opener.postMessage({ type: 'gmail-oauth-${success ? 'success' : 'error'}' }, '*');
      }
    }, 500);

    // Se foi fluxo sem popup (mesma aba), volta automaticamente para o app
    const returnTo = ${JSON.stringify(returnTo || '')};
    if (${success ? 'true' : 'false'} && returnTo) {
      // volta para a página de config do Prazo Zero
      setTimeout(() => {
        window.location.href = returnTo.replace(/\/$/, '') + '/prazo-zero/config?gmail=connected';
      }, 1200);
    }
  </script>
</body>
</html>
  `;
}

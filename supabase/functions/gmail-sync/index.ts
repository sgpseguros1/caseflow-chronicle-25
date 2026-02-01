import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const userId = claimsData.claims.sub;

    // Get user's Gmail token
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: tokenData, error: tokenError } = await adminClient
      .from('pz_gmail_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: 'Gmail não conectado' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Refresh token if expired
    let accessToken = tokenData.access_token;
    if (new Date(tokenData.token_expiry) < new Date()) {
      const refreshed = await refreshAccessToken(tokenData.refresh_token);
      if (refreshed) {
        accessToken = refreshed.access_token;
        await adminClient
          .from('pz_gmail_tokens')
          .update({
            access_token: refreshed.access_token,
            token_expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          })
          .eq('id', tokenData.id);
      }
    }

    // Fetch emails from Gmail
    const messagesResponse = await fetch(
      'https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=is:inbox',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.error('Gmail API error:', errorText);
      return new Response(JSON.stringify({ error: 'Falha ao buscar emails' }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const messagesData = await messagesResponse.json();
    const messages = messagesData.messages || [];

    let imported = 0;
    let skipped = 0;

    for (const msg of messages) {
      // Check if already imported
      const { data: existing } = await adminClient
        .from('pz_emails')
        .select('id')
        .eq('gmail_id', msg.id)
        .single();

      if (existing) {
        skipped++;
        continue;
      }

      // Fetch full message
      const msgResponse = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!msgResponse.ok) continue;

      const msgData = await msgResponse.json();
      const headers = msgData.payload.headers;

      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const from = getHeader('From');
      const subject = getHeader('Subject');
      const date = getHeader('Date');

      // Extract body
      let body = '';
      if (msgData.payload.body?.data) {
        body = atob(msgData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } else if (msgData.payload.parts) {
        const textPart = msgData.payload.parts.find((p: any) => p.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      }

      // Check for attachments
      const hasAttachments = msgData.payload.parts?.some((p: any) => p.filename && p.filename.length > 0) || false;
      const attachments = msgData.payload.parts
        ?.filter((p: any) => p.filename && p.filename.length > 0)
        .map((p: any) => ({
          filename: p.filename,
          mimeType: p.mimeType,
          size: p.body?.size || 0,
          attachmentId: p.body?.attachmentId,
        })) || [];

      // Insert email
      const { error: insertError } = await adminClient
        .from('pz_emails')
        .insert({
          gmail_id: msg.id,
          user_id: userId,
          remetente: from,
          assunto: subject || '(Sem assunto)',
          corpo: body.substring(0, 50000), // Limit body size
          corpo_resumo: body.substring(0, 500),
          data_recebimento: new Date(date).toISOString(),
          tem_anexos: hasAttachments,
          anexos: attachments,
          metadados: { threadId: msgData.threadId, labelIds: msgData.labelIds },
        });

      if (!insertError) imported++;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      imported, 
      skipped,
      total: messages.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sync error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
      client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) return null;
  return response.json();
}

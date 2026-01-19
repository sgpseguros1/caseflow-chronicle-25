import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, instanceUrl, apiKey, instanceName, ...params } = await req.json();

    // Get config from database if not provided
    let config = { instanceUrl, apiKey, instanceName };
    if (!instanceUrl || !apiKey) {
      const { data: channelConfig } = await supabase
        .from("comunicacao_canais_config")
        .select("configuracao")
        .eq("canal", "whatsapp")
        .maybeSingle();
      
      if (channelConfig?.configuracao) {
        const savedConfig = channelConfig.configuracao as any;
        config = {
          instanceUrl: savedConfig.instanceUrl || instanceUrl,
          apiKey: savedConfig.apiKey || apiKey,
          instanceName: savedConfig.instanceName || instanceName || "juspro",
        };
      }
    }

    if (!config.instanceUrl || !config.apiKey) {
      return new Response(
        JSON.stringify({ error: "Evolution API não configurada. Configure a URL e API Key." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = config.instanceUrl.replace(/\/$/, "");
    const headers = {
      "Content-Type": "application/json",
      "apikey": config.apiKey,
    };

    let response;

    switch (action) {
      case "create-instance": {
        // Create a new Evolution API instance
        response = await fetch(`${baseUrl}/instance/create`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            instanceName: config.instanceName,
            qrcode: true,
            integration: "WHATSAPP-BAILEYS",
          }),
        });
        break;
      }

      case "get-qrcode": {
        // Get QR Code for connection
        response = await fetch(`${baseUrl}/instance/connect/${config.instanceName}`, {
          method: "GET",
          headers,
        });
        break;
      }

      case "check-connection": {
        // Check if WhatsApp is connected
        response = await fetch(`${baseUrl}/instance/connectionState/${config.instanceName}`, {
          method: "GET",
          headers,
        });
        break;
      }

      case "send-message": {
        const { to, message, mediaUrl, mediaType } = params;
        
        // Format phone number (remove non-digits, add country code if needed)
        let phone = to.replace(/\D/g, "");
        if (phone.length === 11 && phone.startsWith("9")) {
          phone = "55" + phone;
        } else if (phone.length === 11) {
          phone = "55" + phone;
        } else if (phone.length === 10) {
          phone = "55" + phone;
        }
        
        if (mediaUrl) {
          // Send media message
          response = await fetch(`${baseUrl}/message/sendMedia/${config.instanceName}`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              number: phone,
              mediatype: mediaType || "image",
              media: mediaUrl,
              caption: message,
            }),
          });
        } else {
          // Send text message
          response = await fetch(`${baseUrl}/message/sendText/${config.instanceName}`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              number: phone,
              text: message,
            }),
          });
        }
        break;
      }

      case "fetch-messages": {
        // Get recent messages
        response = await fetch(`${baseUrl}/chat/findMessages/${config.instanceName}`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            where: {
              key: {
                remoteJid: params.remoteJid,
              },
            },
            limit: params.limit || 50,
          }),
        });
        break;
      }

      case "list-chats": {
        // List all chats
        response = await fetch(`${baseUrl}/chat/findChats/${config.instanceName}`, {
          method: "POST",
          headers,
          body: JSON.stringify({}),
        });
        break;
      }

      case "disconnect": {
        // Disconnect WhatsApp
        response = await fetch(`${baseUrl}/instance/logout/${config.instanceName}`, {
          method: "DELETE",
          headers,
        });
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const data = await response.json();

    // Save connection status to database
    if (action === "check-connection" && data.state) {
      await supabase
        .from("comunicacao_canais_config")
        .update({
          ativo: data.state === "open",
          configuracao: {
            ...config,
            lastConnectionState: data.state,
            lastCheck: new Date().toISOString(),
          },
        })
        .eq("canal", "whatsapp");
    }

    return new Response(
      JSON.stringify(data),
      { status: response.ok ? 200 : response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error("Evolution API Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

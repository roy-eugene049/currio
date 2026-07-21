import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type WelcomeEmailRecord = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  status: "pending" | "sent" | "failed";
};

type DatabaseWebhookPayload = {
  type?: string;
  table?: string;
  schema?: string;
  record?: WelcomeEmailRecord;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-currio-webhook-secret",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const webhookSecret = Deno.env.get("WELCOME_EMAIL_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return json({ error: "WELCOME_EMAIL_WEBHOOK_SECRET is not configured" }, 500);
  }

  if (req.headers.get("x-currio-webhook-secret") !== webhookSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("WELCOME_EMAIL_FROM");
  if (!resendApiKey || !from) {
    return json({ error: "Email provider is not configured" }, 500);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = getServiceRoleKey();
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase service key is not configured" }, 500);
  }

  const payload = (await req.json().catch(() => ({}))) as DatabaseWebhookPayload;
  const record = payload.record;

  if (!record?.id || !record.email) {
    return json({ error: "Missing welcome email record" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: queued, error: queueError } = await supabase
    .from("welcome_email_queue")
    .select("id, user_id, email, full_name, status")
    .eq("id", record.id)
    .single();

  if (queueError || !queued) {
    return json({ error: "Welcome email queue row not found" }, 404);
  }

  const queueRow = queued as WelcomeEmailRecord;
  if (queueRow.status === "sent") {
    return json({ ok: true, skipped: "already_sent" });
  }

  const firstName = getFirstName(queueRow.full_name, queueRow.email);
  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [queueRow.email],
      reply_to: Deno.env.get("WELCOME_EMAIL_REPLY_TO") ?? undefined,
      subject: "Welcome to Currio",
      html: renderWelcomeHtml(firstName),
      text: renderWelcomeText(firstName),
    }),
  });

  const resendBody = await resendResponse.json().catch(() => ({}));

  if (!resendResponse.ok) {
    await supabase
      .from("welcome_email_queue")
      .update({
        status: "failed",
        error_message: JSON.stringify(resendBody).slice(0, 1000),
      })
      .eq("id", queueRow.id);

    return json({ error: "Failed to send welcome email", details: resendBody }, 502);
  }

  await supabase
    .from("welcome_email_queue")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      provider_message_id: typeof resendBody.id === "string" ? resendBody.id : null,
      error_message: null,
    })
    .eq("id", queueRow.id);

  return json({ ok: true, id: resendBody.id ?? null });
});

function getServiceRoleKey(): string | null {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;

  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!secretKeys) return null;

  try {
    const parsed = JSON.parse(secretKeys) as Record<string, string | undefined>;
    return parsed.default ?? Object.values(parsed).find(Boolean) ?? null;
  } catch {
    return null;
  }
}

function getFirstName(fullName: string | null, email: string) {
  const name = fullName?.trim();
  if (name) return name.split(/\s+/)[0];
  return email.split("@")[0] || "there";
}

function renderWelcomeText(firstName: string) {
  return [
    `Welcome to Currio, ${firstName}!`,
    "",
    "Your daily curiosity habit starts here. Open Currio to pick your topics, save favorite curios, and build your reading streak.",
    "",
    "See you in the app,",
    "The Currio team",
  ].join("\n");
}

function renderWelcomeHtml(firstName: string) {
  const safeName = escapeHtml(firstName);
  return `<!doctype html>
<html>
  <body style="margin:0;background:#FFF2F2;font-family:Arial,Helvetica,sans-serif;color:#31006E;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFF2F2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E1B0FF;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:34px 30px 18px;background:linear-gradient(135deg,#31006E,#6F00FF);">
                <div style="font-size:38px;font-weight:800;letter-spacing:-1.5px;color:#FFF2F2;">Curri<span style="color:#E1B0FF;">o</span></div>
                <div style="margin-top:10px;color:#E1B0FF;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Curiosity, distilled.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <h1 style="margin:0 0 12px;font-size:26px;line-height:32px;color:#31006E;">Welcome, ${safeName}</h1>
                <p style="margin:0 0 18px;font-size:16px;line-height:25px;color:#5A2088;">
                  Your daily curiosity habit starts here. Open Currio to pick your topics, save favorite curios, and build your reading streak.
                </p>
                <div style="margin-top:24px;padding:18px 20px;border-radius:20px;background:#F3E0FF;color:#31006E;">
                  <strong>Today&apos;s tiny mission:</strong> read one currio and save anything you want to revisit.
                </div>
                <p style="margin:24px 0 0;font-size:14px;line-height:22px;color:#9478B5;">
                  See you in the app,<br/>The Currio team
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

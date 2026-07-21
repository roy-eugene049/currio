import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

type DigestRecipient = {
  user_id: string;
  email: string;
  full_name: string | null;
  categories: string[] | null;
};

type CurioRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  reading_time: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-currio-webhook-secret",
};

const DIGEST_SIZE = 5;
const BATCH_LIMIT = 80;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const webhookSecret =
    Deno.env.get("WEEKLY_DIGEST_CRON_SECRET") ??
    Deno.env.get("WELCOME_EMAIL_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return json({ error: "Digest cron secret is not configured" }, 500);
  }

  if (req.headers.get("x-currio-webhook-secret") !== webhookSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const from =
    Deno.env.get("WEEKLY_DIGEST_FROM") ?? Deno.env.get("WELCOME_EMAIL_FROM");
  if (!resendApiKey || !from) {
    return json({ error: "Email provider is not configured" }, 500);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = getServiceRoleKey();
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase service key is not configured" }, 500);
  }

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    dryRun?: boolean;
  };
  if (body.action && body.action !== "run") {
    return json({ error: "Unknown action" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const weekKey = getWeekKey();
  const dryRun = body.dryRun === true;

  const { data: recipients, error: recipientsError } = await supabase.rpc(
    "get_weekly_digest_recipients",
  );

  if (recipientsError) {
    return json({ error: "Failed to load recipients", details: recipientsError }, 500);
  }

  const list = ((recipients ?? []) as DigestRecipient[]).slice(0, BATCH_LIMIT);
  const summary = {
    weekKey,
    dryRun,
    total: list.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    details: [] as Array<{ email: string; result: string; reason?: string }>,
  };

  for (const recipient of list) {
    if (!recipient.email) {
      summary.skipped += 1;
      summary.details.push({ email: "(missing)", result: "skipped", reason: "no_email" });
      continue;
    }

    const { data: existing } = await supabase
      .from("weekly_digest_queue")
      .select("id, status")
      .eq("user_id", recipient.user_id)
      .eq("week_key", weekKey)
      .maybeSingle();

    if (existing?.status === "sent") {
      summary.skipped += 1;
      summary.details.push({
        email: recipient.email,
        result: "skipped",
        reason: "already_sent_this_week",
      });
      continue;
    }

    const curios = await pickDigestCurios(supabase, recipient.categories ?? []);
    if (curios.length === 0) {
      await upsertQueueRow(supabase, {
        userId: recipient.user_id,
        email: recipient.email,
        weekKey,
        status: "skipped",
        curioIds: [],
        errorMessage: "No published curios available",
      });
      summary.skipped += 1;
      summary.details.push({
        email: recipient.email,
        result: "skipped",
        reason: "no_published_curios",
      });
      continue;
    }

    const queueId = await upsertQueueRow(supabase, {
      userId: recipient.user_id,
      email: recipient.email,
      weekKey,
      status: "pending",
      curioIds: curios.map((c) => c.id),
      errorMessage: null,
    });

    if (dryRun) {
      summary.skipped += 1;
      summary.details.push({
        email: recipient.email,
        result: "skipped",
        reason: "dry_run",
      });
      continue;
    }

    const firstName = getFirstName(recipient.full_name, recipient.email);
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [recipient.email],
        reply_to: Deno.env.get("WELCOME_EMAIL_REPLY_TO") ?? undefined,
        subject: "Your weekly Currio digest",
        html: renderDigestHtml(firstName, curios),
        text: renderDigestText(firstName, curios),
      }),
    });

    const resendBody = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      await supabase
        .from("weekly_digest_queue")
        .update({
          status: "failed",
          error_message: JSON.stringify(resendBody).slice(0, 1000),
        })
        .eq("id", queueId);
      summary.failed += 1;
      summary.details.push({
        email: recipient.email,
        result: "failed",
        reason: JSON.stringify(resendBody).slice(0, 200),
      });
      continue;
    }

    await supabase
      .from("weekly_digest_queue")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id:
          typeof resendBody.id === "string" ? resendBody.id : null,
        error_message: null,
      })
      .eq("id", queueId);

    summary.sent += 1;
    summary.details.push({ email: recipient.email, result: "sent" });
  }

  return json({ ok: true, ...summary });
});

async function pickDigestCurios(
  supabase: SupabaseClient,
  categories: string[],
): Promise<CurioRow[]> {
  let query = supabase
    .from("curios")
    .select("id, title, content, category, reading_time")
    .eq("is_published", true)
    .limit(40);

  if (categories.length > 0) {
    query = query.in("category", categories);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    const fallback = await supabase
      .from("curios")
      .select("id, title, content, category, reading_time")
      .eq("is_published", true)
      .limit(40);
    return shuffle((fallback.data ?? []) as CurioRow[]).slice(0, DIGEST_SIZE);
  }

  return shuffle(data as CurioRow[]).slice(0, DIGEST_SIZE);
}

async function upsertQueueRow(
  supabase: SupabaseClient,
  args: {
    userId: string;
    email: string;
    weekKey: string;
    status: "pending" | "sent" | "failed" | "skipped";
    curioIds: string[];
    errorMessage: string | null;
  },
): Promise<string> {
  const { data, error } = await supabase
    .from("weekly_digest_queue")
    .upsert(
      {
        user_id: args.userId,
        email: args.email,
        week_key: args.weekKey,
        status: args.status,
        curio_ids: args.curioIds,
        error_message: args.errorMessage,
      },
      { onConflict: "user_id,week_key" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to upsert digest queue row");
  }

  return data.id as string;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getWeekKey(date = new Date()): string {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

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

function renderDigestText(firstName: string, curios: CurioRow[]) {
  const lines = [
    `Your weekly Currio digest, ${firstName}`,
    "",
    "Five tiny curios picked for you:",
    "",
  ];

  for (const curio of curios) {
    lines.push(`• ${curio.title} (${curio.category})`);
    lines.push(`  ${curio.content}`);
    lines.push("");
  }

  lines.push("Open Currio to keep your streak going.");
  lines.push("— The Currio team");
  return lines.join("\n");
}

function renderDigestHtml(firstName: string, curios: CurioRow[]) {
  const safeName = escapeHtml(firstName);
  const items = curios
    .map(
      (curio) => `
      <tr>
        <td style="padding:0 0 18px;">
          <div style="padding:16px 18px;border-radius:18px;background:#F8F0FF;border:1px solid #E1B0FF;">
            <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6F00FF;margin-bottom:8px;">${escapeHtml(curio.category)}</div>
            <div style="font-size:17px;font-weight:800;line-height:22px;color:#31006E;margin-bottom:8px;">${escapeHtml(curio.title)}</div>
            <div style="font-size:14px;line-height:21px;color:#5A2088;">${escapeHtml(curio.content)}</div>
          </div>
        </td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;background:#FFF2F2;font-family:Arial,Helvetica,sans-serif;color:#31006E;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFF2F2;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E1B0FF;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:34px 30px 18px;background:linear-gradient(135deg,#31006E,#6F00FF);">
                <div style="font-size:34px;font-weight:800;letter-spacing:-1.5px;color:#FFF2F2;">Curri<span style="color:#E1B0FF;">o</span></div>
                <div style="margin-top:10px;color:#E1B0FF;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Weekly digest</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 30px 8px;">
                <h1 style="margin:0 0 10px;font-size:24px;line-height:30px;color:#31006E;">Hey ${safeName}, here&apos;s your week in curiosity</h1>
                <p style="margin:0 0 22px;font-size:15px;line-height:23px;color:#5A2088;">
                  Five short curios matched to your interests. Open the app anytime to keep exploring.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  ${items}
                </table>
                <p style="margin:8px 0 0;font-size:14px;line-height:22px;color:#9478B5;">
                  See you in Currio,<br/>The Currio team
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

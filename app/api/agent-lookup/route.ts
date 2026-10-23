import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  { auth: { persistSession: false } }
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("user")
      .select("id, email, full_name, referral_code, default_markup")
      .eq("role", "agent")
      .eq("referral_code", code)
      .maybeSingle();

    if (error) {
      console.error("Agent lookup error:", error.message);
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      agent: {
        id: data.id,
        name: data.full_name || data.email?.split("@")[0] || "Agent",
        email: data.email,
        code: data.referral_code || code,
        defaultMarkup: Number(data.default_markup) || 500,
      },
    });
  } catch (err: any) {
    console.error("Agent lookup exception:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

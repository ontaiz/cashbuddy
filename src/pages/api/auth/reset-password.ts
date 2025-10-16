import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Adres e-mail jest wymagany" }), { status: 400 });
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/update-password`,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: "Link do resetowania hasła został wysłany" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas resetowania hasła" }), { status: 500 });
  }
};

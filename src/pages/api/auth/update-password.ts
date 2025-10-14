import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { password } = await request.json();

    if (!password) {
      return new Response(JSON.stringify({ error: "Hasło jest wymagane" }), { status: 400 });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Hasło musi mieć co najmniej 8 znaków" }), { status: 400 });
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Verify user is authenticated (from password reset link)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Nieautoryzowany dostęp" }), { status: 401 });
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: "Hasło zostało zaktualizowane" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Password update error:", error);
    return new Response(JSON.stringify({ error: "Wystąpił błąd podczas aktualizacji hasła" }), { status: 500 });
  }
};


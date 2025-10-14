import { createSupabaseServerInstance } from "../db/supabase.client.ts";
import { defineMiddleware } from "astro:middleware";

// Auth pages
const AUTH_PAGES = ["/login", "/register", "/password-reset", "/update-password"];

// Auth API endpoints
const AUTH_API_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
  "/api/auth/update-password",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Always skip auth checks for API endpoints
  if (AUTH_API_ENDPOINTS.includes(url.pathname)) {
    return next();
  }

  // Check if URL contains password reset code and redirect to update-password page
  const code = url.searchParams.get('code');
  if (code && url.pathname === '/') {
    return redirect(`/update-password?code=${code}`);
  }

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email,
      id: user.id,
    };

    // Redirect logged-in users from auth pages to dashboard
    if (AUTH_PAGES.includes(url.pathname)) {
      return redirect("/dashboard");
    }

    // Redirect logged-in users from root to dashboard
    if (url.pathname === "/") {
      return redirect("/dashboard");
    }
  } else {
    // Allow access to update-password for password reset flow
    // Supabase sends tokens in URL fragment (#) which is not accessible server-side,
    // so we allow access to update-password page without auth for password reset
    if (!AUTH_PAGES.includes(url.pathname) && url.pathname !== '/update-password') {
      return redirect("/login");
    }
  }

  return next();
});

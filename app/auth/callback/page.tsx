"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createBrowserClient } from "@/utils/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Completing sign in...");

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createBrowserClient();
      
      try {
        // Get the code from the URL (Supabase OAuth callback)
        const code = searchParams.get("code");
        
        if (code) {
          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error("Session exchange error:", error);
            setStatus("Authentication failed");
            setTimeout(() => router.push("/sign-in?error=session_error"), 2000);
            return;
          }
          
          if (data.session) {
            // Session created successfully
            setStatus("Successfully signed in!");
            
            // Fetch user profile to see if it exists
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .single();
            
            if (!profile) {
              // Create profile for new users
              await supabase.from("profiles").insert({
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "",
                company: data.user.user_metadata?.company || "",
                avatar_url: data.user.user_metadata?.avatar_url || null,
              });
            }
            
            setTimeout(() => router.push("/dashboard"), 1500);
            return;
          }
        }
        
        // If no code, check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setStatus("Authentication failed");
          setTimeout(() => router.push("/sign-in?error=oauth_error"), 2000);
          return;
        }

        if (session) {
          setStatus("Successfully signed in!");
          setTimeout(() => router.push("/dashboard"), 1500);
        } else {
          router.push("/sign-in");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        router.push("/sign-in?error=unknown");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-brand" />
        <p className="mt-4 text-sm text-gray-500">{status}</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-brand" />
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
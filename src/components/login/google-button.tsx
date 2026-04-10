"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/stores/user-store";
import { clearSWRCache } from "@/lib/swr-fetcher";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

interface GoogleButtonProps {
  /** Pass a role when using in signup flow. Omit for login flow. */
  role?: string;
}

export function GoogleButton({ role }: GoogleButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { setUser } = useUserStore();

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initButton = () => {
      if (!window.google || !containerRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: response.credential, role }),
            });

            const data = await res.json();

            if (!res.ok) {
              toast.error(data.error || "Google sign-in failed");
              return;
            }

            clearSWRCache();
            setUser(data.user);
            document.cookie = "chefcito-auth=true; path=/; max-age=86400";
            router.push("/pos");
          } catch {
            toast.error("Google sign-in failed");
          }
        },
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        width: containerRef.current.offsetWidth || 320,
        text: role ? "signup_with" : "signin_with",
      });
    };

    if (window.google) {
      initButton();
      return;
    }

    // Load the GIS script if not already present
    const existing = document.getElementById("google-gis-script");
    if (existing) {
      existing.addEventListener("load", initButton);
      return () => existing.removeEventListener("load", initButton);
    }

    const script = document.createElement("script");
    script.id = "google-gis-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initButton;
    document.head.appendChild(script);
  }, [role, router, setUser]);

  return <div ref={containerRef} className="w-full" />;
}

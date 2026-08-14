"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Keeps the landing page to signed-out visitors: if a user is already stored,
// send them straight into the app instead of the marketing page.
export function GuestOnly() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem('chefcito-user')) {
      router.replace('/pos');
    }
  }, [router]);

  return null;
}

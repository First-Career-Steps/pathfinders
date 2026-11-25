"use client";
import { useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase";

export default function ClassConfirmation({ lesson }: { lesson: string }) {
  useEffect(() => {
    let active = true;
    if (new URLSearchParams(location.search).get("returnToLesson") !== "1")
      return;
    // The public landing can initialize Supabase's confirmation callback before the private lesson checks its cookie.
    void createBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        if (active && data.session) window.location.replace(lesson);
      });
    return () => {
      active = false;
    };
  }, [lesson]);
  return null;
}

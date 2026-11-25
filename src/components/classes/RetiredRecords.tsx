"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";
import { retiredClasses } from "@/lib/classes/catalog";

type RecordRow = {
  course_slug: string;
  completed_at: string | null;
  last_slide_key: string;
};
export default function RetiredRecords({ userId }: { userId: string }) {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const db = createBrowserClient();
    void db
      .from("student_class_progress")
      .select("course_slug,completed_at,last_slide_key")
      .eq("user_id", userId)
      .in("course_slug", Object.keys(retiredClasses))
      .then(({ data, error }) => {
        if (active) {
          setFailed(!!error);
          setRecords(data || []);
        }
      });
    return () => {
      active = false;
    };
  }, [userId, attempt]);
  if (failed)
    return (
      <p className="mb-4 text-sm">
        Your archived class records couldn’t load.{" "}
        <button className="underline" onClick={() => setAttempt((v) => v + 1)}>
          Try again
        </button>
      </p>
    );
  if (!records.length) return null;
  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-lg">Retired classes</h2>
      <ul className="mt-2 space-y-2">
        {records.map((row) => (
          <li key={row.course_slug}>
            <Link
              className="text-career-blue-dark underline"
              href={"/classes/" + row.course_slug}
            >
              {retiredClasses[row.course_slug]}
            </Link>
            <span>
              {" "}
              ·{" "}
              {row.completed_at
                ? "Completed (retired)"
                : "Started (retired) · last viewed slide " +
                  Number(row.last_slide_key.slice(1))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

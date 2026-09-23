"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";
import { RouteForm } from "@/components/route-form";

export default function NewRoutePage() {
  const { user, loading } = useAnonymousAuth();

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-xs text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center gap-3 pt-1">
        <Link
          href="/routes"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 card-shadow transition hover:bg-gray-50 active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-950">Add a Road</h1>
          <p className="text-xs text-gray-500">Track safety confidence along this route</p>
        </div>
      </header>

      <div className="rounded-3xl border border-gray-200/80 bg-white p-5 card-shadow-lg">
        <RouteForm userId={user.id} />
      </div>
    </div>
  );
}

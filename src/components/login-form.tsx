"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/admin-actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-2 text-sm font-semibold">
        Email
        <input
          name="email"
          type="email"
          required
          className="min-h-12 rounded-2xl border border-black/10 px-4 outline-none focus:border-[#006d77] focus:ring-2 focus:ring-[#006d77]/20"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Password
        <input
          name="password"
          type="password"
          required
          className="min-h-12 rounded-2xl border border-black/10 px-4 outline-none focus:border-[#006d77] focus:ring-2 focus:ring-[#006d77]/20"
        />
      </label>
      {state.error ? (
        <p className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <button
        disabled={pending}
        className="min-h-12 rounded-full bg-[#006d77] px-5 font-semibold text-white transition hover:bg-[#00545c] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

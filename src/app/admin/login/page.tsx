import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.email) redirect("/admin");

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f1e8] px-4 text-[#211f1c]">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl shadow-black/10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#006d77]">
          Admin
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-[#6f6860]">
          Manage the public website content, design, events, partners, and team.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Log in to open your library.</p>
      </div>
      <AuthForm mode="login" />
    </div>
  );
}

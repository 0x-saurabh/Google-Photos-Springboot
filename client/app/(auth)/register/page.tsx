import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-foreground">Create your library</h1>
        <p className="text-sm text-muted-foreground">
          One account, one private place for your photos.
        </p>
      </div>
      <AuthForm mode="register" />
    </div>
  );
}

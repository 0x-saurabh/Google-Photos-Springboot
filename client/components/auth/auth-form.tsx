"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useLogin, useRegister } from "@/hooks/use-auth";
import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "@/lib/validations/auth";

type AuthFormProps = {
  mode: "login" | "register";
};

function PasswordVisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      aria-pressed={visible}
      className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
    >
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const isLogin = mode === "login";
  const login = useLogin();
  const registerUser = useRegister();
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  const pending = isLogin ? login.isPending : registerUser.isPending;
  const error = isLogin ? login.error : registerUser.error;
  const errorMessage =
    error instanceof Error ? error.message : isLogin ? "Unable to sign in" : "Unable to create account";

  if (isLogin) {
    const { register, handleSubmit, formState } = loginForm;

    return (
      <form onSubmit={handleSubmit((values) => login.mutate(values))} className="space-y-6" noValidate>
        <FieldGroup>
          <Field data-invalid={!!formState.errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!formState.errors.email}
              {...register("email")}
            />
            <FieldError errors={[formState.errors.email]} />
          </Field>

          <Field data-invalid={!!formState.errors.password}>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                className="pr-9"
                aria-invalid={!!formState.errors.password}
                {...register("password")}
              />
              <PasswordVisibilityToggle
                visible={showPassword}
                onToggle={() => setShowPassword((value) => !value)}
              />
            </div>
            <FieldError errors={[formState.errors.password]} />
          </Field>
        </FieldGroup>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Spinner className="size-4" />
              Logging in
            </>
          ) : (
            "Log in"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New to Pixora?{" "}
          <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    );
  }

  const { register, handleSubmit, formState } = registerForm;

  return (
    <form onSubmit={handleSubmit((values) => registerUser.mutate(values))} className="space-y-6" noValidate>
      <FieldGroup>
        <Field data-invalid={!!formState.errors.displayName}>
          <FieldLabel htmlFor="displayName">Name</FieldLabel>
          <Input
            id="displayName"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            aria-invalid={!!formState.errors.displayName}
            {...register("displayName")}
          />
          <FieldError errors={[formState.errors.displayName]} />
        </Field>

        <Field data-invalid={!!formState.errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!formState.errors.email}
            {...register("email")}
          />
          <FieldError errors={[formState.errors.email]} />
        </Field>

        <Field data-invalid={!!formState.errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="pr-9"
              aria-invalid={!!formState.errors.password}
              {...register("password")}
            />
            <PasswordVisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword((value) => !value)}
            />
          </div>
          <FieldError errors={[formState.errors.password]} />
        </Field>
      </FieldGroup>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Spinner className="size-4" />
            Creating account
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Lock, Eye, EyeOff, User, Building, ArrowRight, Check, X } from "lucide-react";

// Google icon SVG
const GoogleIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// GitHub icon SVG
const GitHubIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const signUpSchema = z
  .object({
    email: z.string().min(1, "Email is required").email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    full_name: z.string().min(2, "Name must be at least 2 characters"),
    company: z.string().min(1, "Company name is required"),
    terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof signUpSchema>;

const PASSWORD_REQUIREMENTS = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const password = watch("password", "");

  // OAuth sign in handler
  const handleOAuthSignUp = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    const supabase = createBrowserClient();

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "OAuth sign up failed. Please try again.");
      setOauthLoading(null);
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    const supabase = createBrowserClient();

    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            company: data.company,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setIsSuccess(true);
    } catch (error: any) {
      toast.error(error.message || "Sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8 text-center">
          <div className="mx-auto size-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Mail className="size-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="mt-3 text-sm text-gray-500">
            We sent a confirmation link to your email address. Click the link to activate your account.
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Didn't receive it? Check your spam folder or{" "}
            <button
              onClick={() => setIsSuccess(false)}
              className="text-brand hover:underline"
            >
              try again
            </button>
          </p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8">
        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden items-center gap-2 mb-5">
          <span className="size-2 rounded-full bg-brand" />
          <span className="font-semibold text-gray-900">NutraCloud</span>
        </Link>

        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Start your free trial today
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Name field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
              Full name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                {...register("full_name")}
                id="full_name"
                type="text"
                placeholder="Alex Rivera"
                autoComplete="name"
                className={cn(
                  "pl-10 h-11",
                  errors.full_name ? "border-red-400" : ""
                )}
              />
            </div>
            {errors.full_name && (
              <p className="text-xs text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          {/* Company field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company" className="text-sm font-medium text-gray-700">
              Company name <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                {...register("company")}
                id="company"
                type="text"
                placeholder="NutriVive Co."
                autoComplete="organization"
                className={cn(
                  "pl-10 h-11",
                  errors.company ? "border-red-400" : ""
                )}
              />
            </div>
            {errors.company && (
              <p className="text-xs text-red-500">{errors.company.message}</p>
            )}
          </div>

          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Work email <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="alex@company.com"
                autoComplete="email"
                className={cn(
                  "pl-10 h-11",
                  errors.email ? "border-red-400" : ""
                )}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                autoComplete="new-password"
                className={cn(
                  "pl-10 pr-10 h-11",
                  errors.password ? "border-red-400" : ""
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Password requirements */}
          {password && (
            <div className="rounded-lg bg-gray-50 p-3 space-y-1">
              {PASSWORD_REQUIREMENTS.map((req) => (
                <div
                  key={req.label}
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    req.test(password) ? "text-green-600" : "text-gray-400"
                  )}
                >
                  {req.test(password) ? (
                    <Check className="size-3" />
                  ) : (
                    <X className="size-3" />
                  )}
                  {req.label}
                </div>
              ))}
            </div>
          )}

          {/* Confirm password */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                {...register("confirmPassword")}
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your password"
                autoComplete="new-password"
                className={cn(
                  "pl-10 h-11",
                  errors.confirmPassword ? "border-red-400" : ""
                )}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register("terms")}
              id="terms"
              className="mt-0.5 size-4 rounded border-gray-300 text-brand focus:ring-brand"
            />
            <label htmlFor="terms" className="text-sm text-gray-500">
              I agree to the{" "}
              <Link href="/terms" className="text-brand hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-brand hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.terms && (
            <p className="text-xs text-red-500">{errors.terms.message}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full mt-2 flex items-center justify-center gap-2",
              "rounded-xl bg-brand text-white font-semibold text-sm py-2.5",
              "hover:bg-brand-dark transition-all hover:opacity-90 shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        {/* OAuth Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleOAuthSignUp("google")}
            disabled={oauthLoading === "google" || isLoading}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {oauthLoading === "google" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuthSignUp("github")}
            disabled={oauthLoading === "github" || isLoading}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {oauthLoading === "github" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GitHubIcon />
            )}
            GitHub
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

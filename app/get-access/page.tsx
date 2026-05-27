"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Check,
  Loader2,
  ShieldCheck,
  Zap,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { waitlistFormSchema, type WaitlistFormInput } from "@/lib/waitlist";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Research illustration — undraw-inspired, brand colour #7F77DD on white on bg
// ---------------------------------------------------------------------------
function ResearchIllustration() {
  return (
    <svg
      viewBox="0 0 460 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="w-full max-w-md"
    >
      {/* Soft background glows */}
      <circle cx="390" cy="50" r="90" fill="rgba(255,255,255,0.06)" />
      <circle cx="50" cy="320" r="75" fill="rgba(255,255,255,0.05)" />

      {/* Desk surface */}
      <rect x="55" y="248" width="350" height="9" rx="4.5" fill="rgba(255,255,255,0.3)" />

      {/* Flask — stopper */}
      <rect x="97" y="126" width="44" height="10" rx="5" fill="rgba(255,255,255,0.55)" />
      {/* Flask — neck */}
      <rect x="103" y="136" width="32" height="46" rx="4" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
      {/* Flask — conical body */}
      <path d="M103 180 L76 244 Q74 248 78 248 L160 248 Q164 248 162 244 L135 180Z" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.48)" strokeWidth="2" />
      {/* Flask — liquid */}
      <path d="M85 235 Q83 248 95 248 L143 248 Q155 248 153 235 L140 205 L98 205Z" fill="rgba(255,255,255,0.42)" />
      {/* Flask — bubbles */}
      <circle cx="108" cy="226" r="4.5" fill="rgba(255,255,255,0.68)" />
      <circle cx="125" cy="218" r="3" fill="rgba(255,255,255,0.68)" />
      <circle cx="140" cy="228" r="3.5" fill="rgba(255,255,255,0.62)" />
      <circle cx="116" cy="235" r="2.5" fill="rgba(255,255,255,0.5)" />

      {/* Laptop lid */}
      <rect x="170" y="125" width="190" height="123" rx="9" fill="rgba(255,255,255,0.9)" />
      {/* Screen bezel */}
      <rect x="179" y="133" width="172" height="106" rx="5" fill="#6259c4" />
      {/* Sidebar */}
      <rect x="179" y="133" width="38" height="106" rx="5" fill="#5550bc" />
      <rect x="184" y="144" width="28" height="5" rx="2.5" fill="rgba(255,255,255,0.55)" />
      <rect x="184" y="155" width="28" height="5" rx="2.5" fill="rgba(255,255,255,0.3)" />
      <rect x="184" y="166" width="28" height="5" rx="2.5" fill="rgba(255,255,255,0.3)" />
      <rect x="184" y="177" width="28" height="5" rx="2.5" fill="rgba(255,255,255,0.3)" />
      <rect x="184" y="188" width="28" height="5" rx="2.5" fill="rgba(255,255,255,0.3)" />
      {/* Chart bars */}
      <rect x="226" y="163" width="15" height="32" rx="3" fill="rgba(255,255,255,0.32)" />
      <rect x="246" y="152" width="15" height="43" rx="3" fill="rgba(255,255,255,0.55)" />
      <rect x="266" y="158" width="15" height="37" rx="3" fill="rgba(255,255,255,0.42)" />
      <rect x="286" y="145" width="15" height="50" rx="3" fill="rgba(255,255,255,0.68)" />
      <rect x="306" y="155" width="15" height="40" rx="3" fill="rgba(255,255,255,0.48)" />
      {/* KPI chip */}
      <rect x="226" y="204" width="72" height="18" rx="5" fill="rgba(255,255,255,0.15)" />
      <rect x="230" y="208" width="40" height="5" rx="2.5" fill="rgba(255,255,255,0.4)" />
      {/* Live dot */}
      <circle cx="339" cy="141" r="5" fill="rgba(74,222,128,0.85)" />
      {/* Laptop base */}
      <rect x="240" y="248" width="50" height="13" rx="3" fill="rgba(255,255,255,0.5)" />
      <rect x="224" y="261" width="82" height="6" rx="3" fill="rgba(255,255,255,0.38)" />

      {/* Molecule cluster */}
      <circle cx="392" cy="152" r="16" fill="rgba(255,255,255,0.32)" stroke="rgba(255,255,255,0.62)" strokeWidth="2.2" />
      <circle cx="425" cy="112" r="11" fill="rgba(255,255,255,0.26)" stroke="rgba(255,255,255,0.54)" strokeWidth="2" />
      <circle cx="430" cy="182" r="13" fill="rgba(255,255,255,0.29)" stroke="rgba(255,255,255,0.58)" strokeWidth="2" />
      <circle cx="402" cy="210" r="10" fill="rgba(255,255,255,0.24)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
      <circle cx="364" cy="128" r="10" fill="rgba(255,255,255,0.24)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
      <line x1="392" y1="152" x2="425" y2="112" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
      <line x1="392" y1="152" x2="430" y2="182" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
      <line x1="430" y1="182" x2="402" y2="210" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
      <line x1="392" y1="152" x2="364" y2="128" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />

      {/* Pills */}
      <rect x="56" y="278" width="54" height="22" rx="11" fill="rgba(255,255,255,0.28)" />
      <rect x="56" y="278" width="27" height="22" rx="11" fill="rgba(255,255,255,0.5)" />
      <rect x="372" y="274" width="48" height="20" rx="10" fill="rgba(255,255,255,0.24)" />
      <rect x="372" y="274" width="24" height="20" rx="10" fill="rgba(255,255,255,0.44)" />

      {/* Person / scientist */}
      <circle cx="265" cy="82" r="24" fill="rgba(255,255,255,0.58)" />
      <path d="M241 78 Q241 52 265 52 Q289 52 289 78" fill="rgba(255,255,255,0.28)" />
      <rect x="258" y="104" width="14" height="12" rx="3" fill="rgba(255,255,255,0.48)" />
      <path d="M228 125 Q228 116 265 113 Q302 116 302 125 L304 170 Q304 174 300 174 L230 174 Q226 174 226 170Z" fill="rgba(255,255,255,0.44)" />
      <path d="M252 113 L265 133 L278 113" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M228 130 L206 155 Q203 159 206 162 L226 165" fill="rgba(255,255,255,0.38)" />
      <path d="M302 130 L320 150 Q323 154 320 157 L304 165" fill="rgba(255,255,255,0.38)" />

      {/* Sparkle accents */}
      <path d="M326 64 L328.2 57 L330.4 64 L337.4 66 L330.4 68 L328.2 75 L326 68 L319 66Z" fill="rgba(255,255,255,0.55)" />
      <path d="M68 175 L69.4 171 L70.8 175 L74.8 176 L70.8 177 L69.4 181 L68 177 L64 176Z" fill="rgba(255,255,255,0.38)" />
      <circle cx="350" cy="92" r="4" fill="rgba(255,255,255,0.3)" />
      <circle cx="164" cy="302" r="3" fill="rgba(255,255,255,0.22)" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Field wrapper
// ---------------------------------------------------------------------------
function Field({
  label,
  error,
  required,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styled native <select> — react-hook-form compatible, no base-ui friction
// ---------------------------------------------------------------------------
function NativeSelect({
  placeholder,
  options,
  error,
  value,
  onChange,
  onBlur,
  name,
  id,
}: {
  placeholder: string;
  options: { label: string; value: string }[];
  error?: boolean;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={cn(
        "h-9 w-full rounded-lg border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand",
        "focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        !value ? "text-gray-400" : "text-gray-900",
        error ? "border-red-400" : "border-input"
      )}
    >
      <option value="" disabled className="text-gray-400">
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="text-gray-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------------
// Success state
// ---------------------------------------------------------------------------
function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: "tween", ease: "easeOut" }}
      className="flex flex-col items-center text-center py-8 gap-4"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/60">
        <CheckCircle2 className="size-8 text-green-500" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900">
          You&apos;re on the list!
        </h3>
        <p className="mt-2 text-sm text-gray-500 max-w-xs">
          Your request has been recorded. We&apos;ll review demand as access
          opens up, and you can explore the platform in the meantime.
        </p>
      </div>
      <Link
        href="/features"
        className="mt-2 text-sm font-medium text-brand hover:underline"
      >
        See what&apos;s coming →
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Left brand panel
// ---------------------------------------------------------------------------
const BENEFITS = [
  { icon: Zap, text: "Evidence-backed formulations from 50M+ clinical studies" },
  { icon: ShieldCheck, text: "Regulatory-safe claims — no compliance guesswork" },
  { icon: Users, text: "Manufacturer RFQ network built into the platform" },
];

function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-brand flex-col justify-between p-12 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-white/5" />

      <div className="relative z-10">
        <Link href="/" className="flex items-center gap-2.5 mb-10">
          <span className="size-2 rounded-full bg-white" />
          <span className="font-semibold text-white text-lg tracking-tight">EnhanceLabs</span>
        </Link>

        <h2 className="text-3xl font-bold text-white leading-snug mb-8">
          The operating system for supplement brands.
        </h2>

        <ul className="space-y-5 mb-10">
          {BENEFITS.map(({ text }) => (
            <li key={text} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Check className="size-3.5 text-white" />
              </span>
              <span className="text-sm text-purple-100 leading-relaxed">{text}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2.5 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm w-fit">
          <div className="flex -space-x-2">
            {["SC", "MR", "PN", "KL", "AR"].map((init) => (
              <div
                key={init}
                className="size-7 rounded-full bg-white/30 border-2 border-brand flex items-center justify-center text-[9px] font-bold text-white"
              >
                {init}
              </div>
            ))}
          </div>
          <p className="text-sm text-purple-100">
            Join <strong className="text-white">500+ brands</strong> already on the waitlist
          </p>
        </div>
      </div>

      <div className="relative z-10 flex justify-center mt-8">
        <ResearchIllustration />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form options
// ---------------------------------------------------------------------------
const ROLE_OPTIONS = [
  { label: "Supplement founder", value: "founder" },
  { label: "Brand agency", value: "agency" },
  { label: "cGMP manufacturer", value: "manufacturer" },
  { label: "Formulation consultant", value: "consultant" },
  { label: "E-commerce operator", value: "ecommerce" },
  { label: "Other", value: "other" },
];

const BRAND_COUNT_OPTIONS = [
  { label: "Just mine (1)", value: "1" },
  { label: "2–5", value: "2-5" },
  { label: "6–20", value: "6-20" },
  { label: "20+", value: "20+" },
];

const SOURCE_OPTIONS = [
  { label: "LinkedIn", value: "linkedin" },
  { label: "Twitter / X", value: "twitter" },
  { label: "Reddit", value: "reddit" },
  { label: "Friend / colleague", value: "referral" },
  { label: "Google", value: "google" },
  { label: "Other", value: "other" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function GetAccessPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistFormInput>({
    resolver: zodResolver(waitlistFormSchema),
    defaultValues: {
      full_name: "",
      email: "",
      company: "",
      role: "",
      brand_count: "",
      source: "",
      website: "",
    },
  });

  const onSubmit = async (data: WaitlistFormInput) => {
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = (await response.json().catch(() => null)) as
        | { message?: string; ok?: boolean }
        | null;

      if (!response.ok) {
        toast.error(
          result?.message ?? "Something went wrong. Please try again.",
          { duration: 5000 }
        );
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error("Unable to submit right now. Please try again.", {
        duration: 5000,
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100dvh-4rem)]">
      <BrandPanel />

      <div className="flex flex-1 items-center justify-center bg-gray-50 px-5 py-12">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, type: "tween" }}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8"
              >
                <SuccessState />
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, type: "tween" }}
                className="rounded-2xl bg-white border border-gray-100 shadow-sm p-8"
              >
                {/* Mobile logo */}
                <Link href="/" className="flex lg:hidden items-center gap-2 mb-5">
                  <span className="size-2 rounded-full bg-brand" />
                  <span className="font-semibold text-gray-900">EnhanceLabs</span>
                </Link>

                <div className="mb-7">
                  <h1 className="text-2xl font-bold text-gray-900">Get early access</h1>
                  <p className="mt-1.5 text-sm text-gray-500">
                    We review applications within 48 hours.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                  <input
                    {...register("website")}
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    aria-hidden="true"
                  />

                  <Field label="Full name" error={errors.full_name?.message} required htmlFor="full_name">
                    <Input
                      {...register("full_name")}
                      id="full_name"
                      placeholder="Alex Rivera"
                      autoComplete="name"
                      aria-invalid={!!errors.full_name}
                      className={errors.full_name ? "border-red-400" : ""}
                    />
                  </Field>

                  <Field label="Work email" error={errors.email?.message} required htmlFor="email">
                    <Input
                      {...register("email")}
                      id="email"
                      type="email"
                      placeholder="alex@yourbrand.com"
                      autoComplete="email"
                      aria-invalid={!!errors.email}
                      className={errors.email ? "border-red-400" : ""}
                    />
                  </Field>

                  <Field label="Company name" error={errors.company?.message} required htmlFor="company">
                    <Input
                      {...register("company")}
                      id="company"
                      placeholder="NutriVive Co."
                      autoComplete="organization"
                      aria-invalid={!!errors.company}
                      className={errors.company ? "border-red-400" : ""}
                    />
                  </Field>

                  <Field label="Your role" error={errors.role?.message} required htmlFor="role">
                    <Controller
                      name="role"
                      control={control}
                      render={({ field }) => (
                        <NativeSelect
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Select your role"
                          options={ROLE_OPTIONS}
                          error={!!errors.role}
                          id="role"
                        />
                      )}
                    />
                  </Field>

                  <Field
                    label="How many brands do you work with?"
                    error={errors.brand_count?.message}
                    required
                    htmlFor="brand_count"
                  >
                    <Controller
                      name="brand_count"
                      control={control}
                      render={({ field }) => (
                        <NativeSelect
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Select one"
                          options={BRAND_COUNT_OPTIONS}
                          error={!!errors.brand_count}
                          id="brand_count"
                        />
                      )}
                    />
                  </Field>

                  <Field
                    label="How did you hear about us?"
                    error={errors.source?.message}
                    required
                    htmlFor="source"
                  >
                    <Controller
                      name="source"
                      control={control}
                      render={({ field }) => (
                        <NativeSelect
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Select one"
                          options={SOURCE_OPTIONS}
                          error={!!errors.source}
                          id="source"
                        />
                      )}
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "w-full mt-2 flex items-center justify-center gap-2",
                      "rounded-xl bg-brand text-white font-semibold text-sm py-2.5",
                      "hover:bg-brand-dark transition-all hover:opacity-90 shadow-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                      "disabled:opacity-60 disabled:cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      "Join the waitlist"
                    )}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs text-gray-400">
                  No spam, ever. We only email about your application.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

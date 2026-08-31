"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/custom/Button";
import { apiPost } from "@/lib/api";
import toast from "react-hot-toast";

const forgotPasswordSchema = z.object({
  credential: z
    .string()
    .min(1, "Email or phone number is required"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    try {
      await apiPost("/auth/forgot-password", {
        credential: data.credential,
        email: data.credential.includes("@") ? data.credential : undefined,
        phone: !data.credential.includes("@") ? data.credential : undefined,
      });
      setIsSubmitted(true);
      toast.success("Password reset instructions sent");
    } catch (error: any) {
      // Even on error, show the submitted state or message for security
      setIsSubmitted(true);
      toast.success("Password reset instructions sent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full px-6 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>

        {isSubmitted ? (
          <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 bg-green-50 text-brand-700 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Check your inbox
            </h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              If an account with that credential exists, we have sent a link to reset your password. The link will expire in 24 hours.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-3 px-4 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm transition-colors text-center shadow-sm"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Forgot password?
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                No worries! Enter your registered email or phone and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <Input
                label="Email or Phone Number"
                type="text"
                placeholder="vendor@example.com or 08012345678"
                leftElement={<Mail size={16} />}
                error={errors.credential?.message}
                {...register("credential")}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={loading}
              >
                Send Reset Link
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

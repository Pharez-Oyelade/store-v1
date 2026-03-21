"use client";

// ZOD + React Hook Form

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/custom/Button";
import toast from "react-hot-toast";
import { useLogin } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z
    .email("please enter a valid email address")
    .min(1, "Email is required"),
  // .email("please enter a valid email address"),
  password: z
    .string()
    .min(1, "password is required")
    .min(6, "password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Hook called at the top level of the component (Rules of Hooks)
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex gap-20 items-center h-full overflow-hidden">
      <div className="relative hidden md:block w-full h-full overflow-hidden">
        <div className="absolute w-full h-full bg-black/80" />
        <Image
          src="/storefront.jpg"
          width={500}
          height={500}
          className="w-full"
          alt="login_image"
        />
      </div>
      {/* Header */}

      <div className="mb-6 w-full px-12">
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in to your SabiStore dashboard
          </p>
        </div>

        {/* LOGIN FORM */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Email */}
          <Input
            label="Email address"
            type="email"
            placeholder="eri@example.com"
            autoComplete="email"
            leftElement={<Mail size={16} />}
            error={errors.email?.message}
            {...register("email")}
          />

          {/* Password */}
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="password"
            autoComplete="current-password"
            leftElement={<Lock size={16} />}
            error={errors.password?.message}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
            {...register("password")}
          />

          {/* Forgot password link */}
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-brand-700 hover:text-brand-800 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={loginMutation.isPending}
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

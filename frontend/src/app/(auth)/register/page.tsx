"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  MapPin,
  Lock,
  Subtitles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import toast from "react-hot-toast";
import { generateSlug } from "@/lib/utils";

// ZOD SCHEMA
// .regex() validates against regular expression pattern

const registerSchema = z
  .object({
    businessName: z
      .string()
      .min(2, "Business name must be at least 2 characters")
      .max(60, "Business name is too long"),
    handle: z
      .string()
      .min(3, "Handle must be at least 3 characters")
      .max(30, "Handle must be at most 30 characters")
      .regex(
        /^[a-z0-9-]+$/,
        "Handle can only contain lowercase letters, numbers, and hyphens",
      ),
    phone: z
      .string()
      .min(10, "Enter a valid phone number")
      .regex(
        /^0[7-9][01]\d{8}$/,
        "Enter a valid Nigerian phone number (e.g. 08012345678)",
      ),
    email: z.email("Enter a valid email address").optional().or(z.literal("")), //allow empty string (email optional)
    state: z.string().min(1, "Please select your state"),
    city: z.string().min(2, "City is required"),
    area: z.string().optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// step definition - assigning foelds to steps
const stepFields: Record<number, (keyof RegisterFormValues)[]> = {
  1: ["businessName", "handle", "phone", "email"],
  2: ["state", "city", "area"],
  3: ["password", "confirmPassword"],
};

const nigerianStates = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
].map((s) => ({ value: s, label: s }));

const TOTAL_STEPS = 3;

const stepTitles = [
  { title: "Business Info", subtitle: "Tell us about your business" },
  { title: "Location", subtitle: "Where are you based?" },
  { title: "Set Password", subtitle: "Secure your account" },
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    trigger, //validate specific fields
    setValue, //set a field's value
    watch, //read a field's value in real time
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      area: "",
    },
  });

  // Auto generate handle from businessName
  const businessName = watch("businessName");
  const handleAutoGenerate = () => {
    if (businessName) {
      setValue("handle", generateSlug(businessName), { shouldValidate: true });
    }
  };

  // validate current step before advancing
  const handleNextStep = async () => {
    // trigger(fields) runs validation on only those fields

    const valid = await trigger(stepFields[currentStep]);
    if (valid) setCurrentStep((s) => s + 1);
  };

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      console.log("Registration data:", data);
      toast.success("Account created! Redirecting to dashboard...");
      // useRegister() when auth is built
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registration failed",
      );
    }
  };

  return (
    <div className="flex gap-20 items-center h-full overflow-hidden">
      {/* progress bar + step title */}
      <div className="w-full">
        <div className="flex flex-col items-center justify-center mb-1">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {stepTitles[currentStep - 1].title}
            </h1>
            <p className="text-sm text-gray-500">
              {stepTitles[currentStep - 1].subtitle}
            </p>
          </div>
          <span className="text-sm text-gray-400 font-medium">
            {currentStep} / {TOTAL_STEPS}
          </span>
          <div className="w-1/2 py-2">
            {/* progress bar */}
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${i < currentStep ? "bg-brand-600" : "bg-gray-200"}`}
                />
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="py-2 w-full md:w-2/3 px-10"
          >
            {/* STEP 1 - Business Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <Input
                  label="Business Name"
                  placeholder="Eri's Fashion House"
                  error={errors.businessName?.message}
                  leftElement={<Building2 size={16} />}
                  {...register("businessName")}
                />

                <div>
                  <Input
                    label="store Handle"
                    placeholder="eris-fashion-house"
                    helper="Your storefront URL: sabistore.ng/store/your-handle"
                    error={errors.handle?.message}
                    leftElement={
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        @
                      </span>
                    }
                    {...register("handle")}
                  />
                  <button
                    type="button"
                    onClick={handleAutoGenerate}
                    className="text-xs text-brand-600 hover:text-brand-700 mt-1 font-medium transition-colors"
                  >
                    Auto generate from business name
                  </button>
                </div>

                <Input
                  label="WhatsApp / PhoneNumber"
                  type="tel"
                  placeholder="08012345678"
                  error={errors.phone?.message}
                  {...register("phone")}
                />

                <Input
                  label="Email Address (optional)"
                  type="email"
                  placeholder="eri@example.com"
                  helper="We'll use this for account recovery"
                  error={errors.email?.message}
                  {...register("email")}
                />
              </div>
            )}

            {/* STEP 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <Select
                  label="state"
                  options={nigerianStates}
                  placeholder="Select your state"
                  error={errors.state?.message}
                  defaultValue="Select state"
                  {...register("state")}
                />

                <Input
                  label="City / Town"
                  placeholder="Ibadan"
                  error={errors.city?.message}
                  {...register("city")}
                />

                <Input
                  label="Market / Area (optional)"
                  placeholder="Dugbe Market, University of Ibadan area"
                  helper="Helps buyers find you in the discovery network"
                  error={errors.area?.message}
                  {...register("area")}
                />

                <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 text-sm text-brnad-700">
                  Your location helps buyers nearby discover ypur store
                </div>
              </div>
            )}

            {/* STEP - 3: Password */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  error={errors.password?.message}
                  helper="Min 8 character, 1 uppercase letter, 1 number"
                  leftElement={<Lock size={16} />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  {...register("password")}
                />

                <Input
                  label="Confirm Password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  error={errors.confirmPassword?.message}
                  leftElement={<Lock size={16} />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  {...register("confirmPassword")}
                />

                <p className="text-xs text-gray-400">
                  By creating an account you agree to our{" "}
                  <Link
                    href="/terms"
                    className="text-brand-600 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-brand-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            )}

            {/* NAV BUTTONS */}
            <div className="flex gap-3 mt-6">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  leftIcon={<ArrowLeft size={16} />}
                  onClick={() => setCurrentStep((s) => s - 1)}
                >
                  Back
                </Button>
              )}

              {currentStep < TOTAL_STEPS ? (
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  rightIcon={<ArrowRight size={16} />}
                  onClick={handleNextStep}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  size="large"
                  isLoading={isSubmitting}
                >
                  Create My Free Account
                </Button>
              )}
            </div>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-brand-700 font-semibold hover:text-brand-800"
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>

      {/* IMAGE */}
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
    </div>
  );
}

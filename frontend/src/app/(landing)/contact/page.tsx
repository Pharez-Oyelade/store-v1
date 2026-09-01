"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/custom/Button";
import { apiPost } from "@/lib/api";
import toast from "react-hot-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().optional(),
  message: z.string().min(5, "Message must be at least 5 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data: ContactFormValues) => {
    setLoading(true);
    try {
      await apiPost("/contact", data);
      setSubmitted(true);
      reset();
      toast.success("Message sent! We'll reply shortly.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-700 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Info Column */}
          <div className="lg:col-span-5 bg-linear-to-br from-brand-900 to-gray-900 text-white p-8 sm:p-10 rounded-2xl flex flex-col justify-between shadow-sm">
            <div>
              <span className="text-xs font-semibold tracking-wider text-brand-300 uppercase">
                Get in Touch
              </span>
              <h1 className="text-3xl font-serif font-bold mt-2 mb-4">
                We&apos;d love to hear from you
              </h1>
              <p className="text-gray-300 text-sm leading-relaxed mb-8">
                Have questions about onboarding your fashion store, managing
                bespoke demands, or custom pricing tiers? Our team is here to
                help.
              </p>

              <div className="space-y-6 text-sm">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-brand-300 shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Email Us</p>
                    <a
                      href="mailto:hello@vendra.ng"
                      className="font-medium hover:text-brand-300 transition-colors"
                    >
                      {/* hello@vendra.ng */}
                      pharezoyelade@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-brand-300 shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">
                      Call / WhatsApp Support
                    </p>
                    <a
                      href="https://wa.me/2348012345678"
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium hover:text-brand-300 transition-colors"
                    >
                      +234 8137742724
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center text-brand-300 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Headquarters</p>
                    <p className="font-medium">Oyo, Nigeria</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
              <a
                href="https://wa.me/2348137742724?text=Hello%20Vendra%20team,%20I%20have%20an%20inquiry%20about%20your%20platform."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-brand-700 hover:bg-brand-600 text-white font-medium text-sm transition-colors"
              >
                <MessageCircle size={18} />
                Chat Directly on WhatsApp
              </a>
            </div>
          </div>

          {/* Contact Form Column */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-gray-100 shadow-sm">
            {submitted ? (
              <div className="py-16 text-center">
                <div className="mx-auto w-14 h-14 bg-green-50 text-brand-700 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                  Message received!
                </h2>
                <p className="text-gray-600 text-sm max-w-md mx-auto mb-8">
                  Thank you for reaching out. A member of our support team will
                  get back to you within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="py-2.5 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-sm transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                  Send us a message
                </h2>
                <p className="text-gray-500 text-sm mb-8">
                  Fill out the form below and we will respond promptly.
                </p>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-6"
                  noValidate
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                      label="Your Name"
                      type="text"
                      placeholder="e.g. Adebayo Ogunlesi"
                      error={errors.name?.message}
                      {...register("name")}
                    />

                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="adebayo@example.com"
                      error={errors.email?.message}
                      {...register("email")}
                    />
                  </div>

                  <Input
                    label="Subject (Optional)"
                    type="text"
                    placeholder="e.g. Tailoring module inquiry"
                    error={errors.subject?.message}
                    {...register("subject")}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={5}
                      placeholder="How can we help your fashion business?"
                      className="w-full rounded-xl border border-gray-200 p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700 transition-colors"
                      {...register("message")}
                    />
                    {errors.message?.message && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full sm:w-auto px-8 flex"
                    isLoading={loading}
                  >
                    <div className="flex">
                      <Send size={16} className="mr-2" />
                      <span>Send Message</span>
                    </div>
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

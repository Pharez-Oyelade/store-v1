import Button from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import React from "react";

const Hero = () => {
  return (
    <section className="relative px-4 md:px-15 py-24 md:py-20 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0 min-h-dvh">
      {/* Hero content */}
      <div className="w-full md:w-1/2 space-y-8">
        {/* Eyebrow */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-0.5 bg-accent-600" />
          <span className="text-accent-600 text-xs md:text-sm font-bold uppercase">
            Built for Nigerian Fashion Vendors
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
          Your Store. <br />
          <span className="text-accent-900 font-cursive text-6xl md:text-9xl">
            Finally
          </span>{" "}
          <br />
          under control.
        </h1>

        {/* text */}
        <p className="max-w-lg text-base text-gray-600">
          Stop managing orders in DMs and inventory in notebooks. Sabi Store
          gives fashion vendors one clean dashboard for everything — stock,
          orders, customers, and sales. Built for the Nigerian market.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link href="/login">
            <Button size="large" variant="primary">
              Get Started
            </Button>
          </Link>

          <Link href="/how-it-works">
            <Button size="large" variant="ghost">
              Learn how it works →
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative w-full md:w-1/2">
        <div className="w-full p-4 border-2 border-brand-400 rounded-lg overflow-hidden group shadow-lg">
          <Image
            width={700}
            height={700}
            src="/dashboard_mockup.png"
            alt="Hero Image"
            className="w-full h-full rounded-xl group:hover:scale-90 transition-transform duration-300"
          />

          {/* floating card */}
          <div className="hidden md:block absolute top-20 -left-20 border border-gray-300 bg-white p-4 rounded-lg shadow-lg w-64 pointer-events-none group-hover:-translate-x-1.5 transform transition-transform duration-400">
            <h3 className="text-sm font-bold text-gray-800">Live Tracking</h3>
            <p className="text-xs text-gray-500">
              Monitor your orders in real-time
            </p>
          </div>

          <div className="hidden md:block absolute top-40 -left-30 border border-gray-300 bg-white p-4 rounded-lg shadow-lg w-64 pointer-events-none group-hover:translate-x-1.5 transform transition-transform duration-400">
            <h3 className="text-sm font-bold text-gray-800">340+</h3>
            <p className="text-xs text-gray-500">Vendors using SabiStore</p>
          </div>
        </div>
      </div>

      {/* faded product name */}
      <div className="absolute bottom-0 left-0">
        <h1 className="text-[150px] -z-50 outline-text opacity-6 px-20">
          SABI
        </h1>
      </div>
    </section>
  );
};

export default Hero;

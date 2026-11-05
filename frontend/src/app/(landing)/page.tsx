import React from "react";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Problem from "./components/Problem";
import Features from "./components/Features";
import WhatsAppShowcase from "./components/whatsapp/WhatsAppShowcase";
import Process from "./components/Process";
import Testimonials from "./components/Testimonials";
import FAQ from "./components/FAQ";
import Newsletter from "./components/Newsletter";
import CTA from "./components/CTA";
import ScrollToTop from "@/components/layout/ScrollToTop";

const page = () => {
  return (
    <div className="bg-white overflow-x-hidden">
      <Hero />
      <Marquee />
      <Problem />
      <Features />
      <WhatsAppShowcase />
      <Process />
      {/* <Testimonials /> */}
      <FAQ />
      {/* <Newsletter /> */}
      <CTA />
      {/* <ScrollToTop /> */}
    </div>
  );
};

export default page;

import React from "react";
import Input from "@/components/ui/Input";
import Navbar from "@/components/layout/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Problem from "./components/Problem";
import Features from "./components/Features";
import Process from "./components/Process";
import FAQ from "./components/FAQ";
import CTA from "./components/CTA";
import Footer from "@/components/layout/Footer";

const page = () => {
  return (
    <div className="bg-white overflow-x-hidden">
      <Navbar />
      <Hero />
      <Marquee />
      <Problem />
      <Features />
      <Process />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default page;

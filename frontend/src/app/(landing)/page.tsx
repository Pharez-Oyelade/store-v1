import React from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Navbar from "@/components/layout/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Problem from "./components/Problem";
import Features from "./components/Features";
import Process from "./components/Process";
import Testimonials from "./components/Testimonials";
import Newsletter from "./components/Newsletter";
import Footer from "@/components/layout/Footer";

const page = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Marquee />
      <Problem />
      <Features />
      <Process />
      <Testimonials />
      <Newsletter />
      <Footer />
    </>
  );
};

export default page;

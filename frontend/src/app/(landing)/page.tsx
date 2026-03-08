import React from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Navbar from "@/components/layout/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Problem from "./components/Problem";
import Features from "./components/Features";

const page = () => {
  return (
    <>
      <Hero />
      <Marquee />
      <Problem />
      <Features />
    </>
  );
};

export default page;

import React from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Navbar from "@/components/layout/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Problem from "./components/Problem";
import Features from "./components/Features";
import Process from "./components/Process";

const page = () => {
  return (
    <>
      <Hero />
      <Marquee />
      <Problem />
      <Features />
      <Process />
    </>
  );
};

export default page;

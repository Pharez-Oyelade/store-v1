import Eyebrow from "@/components/ui/Eyebrow";
import { Title } from "@/components/ui/Title";
import React from "react";

const Problem = () => {
  return (
    <section className="px-5 md:px-15 py-20">
      <div>
        <Title
          headingStart="Running a fashion brand through DMs"
          headingSpan="isn't"
          headingEnd="a strategy."
          eyebrowTitle="The Problem"
          text="Every order lost in chat. Every inventory mistake costing you money. Every customer forgotten. Sound familiar?"
        />
      </div>
    </section>
  );
};

export default Problem;

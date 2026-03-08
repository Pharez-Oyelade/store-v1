import React from "react";
import Eyebrow from "./Eyebrow";

interface TitleProps {
  eyebrowTitle: string;
  headingStart: string;
  headingSpan: string;
  headingEnd?: string;
  text?: string;
}

export const Title = ({
  eyebrowTitle,
  headingStart,
  headingSpan,
  headingEnd,
  text,
}: TitleProps) => {
  return (
    <div className="space-y-2 md:space-y-3 max-w-4xl">
      <Eyebrow title={eyebrowTitle} />
      <h1 className="font-bold text-3xl md:text-7xl tracking-tighter">
        {headingStart}{" "}
        <span className="text-accent-600 font-cursive text-5xl md:text-8xl">
          {headingSpan}
        </span>{" "}
        {headingEnd && <span>{headingEnd}</span>}{" "}
      </h1>
      {text && <p className="max-w-3xl text-sm md:text-base">{text}</p>}
    </div>
  );
};

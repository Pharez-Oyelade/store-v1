import React from "react";

interface EyebrowProps {
  title: string;
}

const Eyebrow = ({ title }: EyebrowProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-accent-500 text-sm font-medium uppercase">
        {title}
      </span>
      <div className="w-10 h-0.5 bg-accent-500" />
    </div>
  );
};

export default Eyebrow;

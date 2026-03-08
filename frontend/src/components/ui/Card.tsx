import { cn } from "@/lib/utils";
import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean; //cards with tables or images
  hoverable?: boolean;
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

function Card({
  children,
  className,
  noPadding = false,
  hoverable = false,
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-100",
        "shadow-card",
        !noPadding && "p-5",
        hoverable &&
          "cursor-pointer transition-all duration-150 hover:translate-y-0.5 hover:shadow-raised",
        className,
      )}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className }: CardSectionProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      {children}
    </div>
  );
}

function CardTitle({ children, className }: CardSectionProps) {
  return (
    <h3 className={cn("text-base font-semibold text-gray-900", className)}>
      {children}
    </h3>
  );
}

function CardBody({ children, className }: CardSectionProps) {
  return <div className={cn("", className)}>{children}</div>;
}

function CardFooter({ children, className }: CardSectionProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100",
        className,
      )}
    >
      {children}
    </div>
  );
}

// Attach sub-components as properties on Card
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;

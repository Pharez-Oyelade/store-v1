import { Title } from "@/components/ui/Title";
import React from "react";
import { getInitials, generateSlug } from "@/lib/utils";
import { Quote, Dot } from "lucide-react";

const testimonialData = [
  {
    comment:
      "Before Vendra I was using three WhatsApp groups and a notebook to track everything. I lost at least two big orders a week. Now everything is in one place and I actually know my numbers.",
    name: "Temi Okonkwo",
    handle: "temi_closet",
    location: "Ogbomoso",
  },
  {
    comment:
      "The storefront link is what sold me. I put it in my bio and customers can just see what's available without pinging me every five minutes asking 'what do you have in stock?",
    name: "Funke Adeyemi",
    handle: "fabbybyfunke",
    location: "Ibadan",
  },
  {
    comment:
      "I did ₦1.2 million in sales last month and for the first time I could actually see which items drove it. The analytics are simple but they tell me exactly what to restock.",
    name: "Chidinma Nweke",
    handle: "chidinmafashion",
    location: "Enugu",
  },
];

const Testimonials = () => {
  return (
    <section className="px-5 md:px-15 py-20">
      <div className="max-w-xl">
        <Title
          eyebrowTitle="vendors love it"
          headingStart="Real vendors."
          headingSpan="Real results."
        />
      </div>

      {/* TESTIMONIALS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-5 mt-10">
        {testimonialData.map((td, index) => (
          <div
            key={index}
            className="relative space-y-5 border-2 border-gray-400 rounded-2xl p-8 overflow-hidden shadow-lg hover:border-accent-600 hover:bg-accent-100 transition-all duration-300 ease-in-out"
          >
            <div className="absolute -top-3 left-2">
              <Quote className="w-20 h-20 text-accent-400 opacity-40" />
            </div>

            <p className="pt-10">"{td.comment}"</p>

            <div className="flex gap-2 items-center">
              <div className="w-12 h-12 items-center text-center rounded-full flex justify-center font-bold text-lg p-2 bg-accent-100 text-accent-500">
                {getInitials(td.name)}
              </div>

              <div className="leading-4">
                <p>{td.name}</p>
                <div className="flex gap-1 tracking-tight items-center text-gray-400 text-xs">
                  <span>@{td.handle}</span>
                  <Dot />
                  <span>{td.location}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;

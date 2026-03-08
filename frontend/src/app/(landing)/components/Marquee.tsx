const features = [
  "Order Management",
  "Inventory Tracking",
  "Sales Analytics",
  "Customer Insights",
  "Multi-Channel Sync",
  "Automated Reports",
];

export default function Marquee() {
  return (
    <div className="overflow-hidden bg-accent-800 py-3 relative before:absolute before:top-0 before:left-0 before:w-30 before:h-full before:bg-gradient-to-r before:from-black before:to-transparent">
      <div className="flex w-max animate-marquee gap-12 text-white font-medium text-sm tracking-wide">
        {[...features, ...features].map((item, index) => (
          <span key={index} className="whitespace-nowrap">
            {item} <span className="px-10">✦</span>{" "}
          </span>
        ))}
      </div>
    </div>
  );
}

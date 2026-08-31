const featuresTop = [
  "Inventory Tracking",
  "Order Management",
  "Sales Analytics",
  "Customer Insights",
  "Multi-Channel Sync",
  "Automated Reports",
];

const featuresBottom = [
  "Seamless Storefronts",
  "WhatsApp Integration",
  "Real-time Alerts",
  "Performance Metrics",
  "Fast Payouts",
  "Global Reach",
];

export default function Marquee() {
  return (
    <div className="relative overflow-hidden bg-accent-700 py-5 md:py-6 flex flex-col gap-4 z-0">
      {/* Top and Bottom faded edges */}
      <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-black/70 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-black/70 to-transparent z-10 pointer-events-none" />

      {/* Top Marquee */}
      <div className="flex w-max animate-marquee gap-8 md:gap-16 opacity-70">
        {[...featuresTop, ...featuresTop, ...featuresTop].map((item, index) => (
          <div
            key={`top-${index}`}
            className="flex items-center gap-8 md:gap-16"
          >
            <span className="whitespace-nowrap text-2xl md:text-3xl font-bold text-white tracking-widest uppercase">
              {item}
            </span>
            <span className="text-accent-400 text-xl md:text-3xl">✦</span>
          </div>
        ))}
      </div>

      {/* Bottom Marquee (Reverse) */}
      {/* <div className="flex w-max animate-marquee-reverse gap-8 md:gap-16 opacity-40">
        {[...featuresBottom, ...featuresBottom, ...featuresBottom].map(
          (item, index) => (
            <div
              key={`bottom-${index}`}
              className="flex items-center gap-8 md:gap-16"
            >
              <span className="whitespace-nowrap text-2xl md:text-4xl font-bold text-white tracking-widest uppercase">
                {item}
              </span>
              <span className="text-brand-500 text-lg md:text-2xl">✦</span>
            </div>
          ),
        )}
      </div> */}
    </div>
  );
}

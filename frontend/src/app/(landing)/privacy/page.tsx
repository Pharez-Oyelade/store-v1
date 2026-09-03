import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | Vendra",
  description: "Privacy policy describing how Vendra collects, protects, and manages data for vendors and customers.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl border border-gray-100 shadow-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-700 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
            <Lock size={20} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            Privacy Policy
          </h1>
        </div>

        <p className="text-sm text-gray-500 mb-8 pb-4 border-b border-gray-100">
          Last updated: August 31, 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when you register a vendor account, manage inventory, record orders, save customer measurements, or communicate with our support team. This includes:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Account Data:</strong> Business name, store handle, phone number, email address, physical location.</li>
              <li><strong>Commerce Data:</strong> Product listings, variant prices, bespoke demands, fabric material records, customer notes, and measurements.</li>
              <li><strong>Transaction Data:</strong> Subscription payment references processed securely via Paystack.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p>We use the data collected to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Provide, maintain, and improve the Vendra dashboard, inventory tools, and public storefronts.</li>
              <li>Enable instant WhatsApp message linking between you and your customers.</li>
              <li>Process subscription upgrades and send critical system alerts.</li>
              <li>Generate anonymized platform analytics to optimize service speed and uptime.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Security & Cookies</h2>
            <p>
              We implement industry-standard encryption, HTTP-only secure session cookies, and strict database query sanitization. We do not sell your personal data or your customers&apos; contact details to third-party advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Third-Party Service Providers</h2>
            <p>
              We work with trusted third-party providers for hosting (MongoDB Atlas), media storage (Cloudinary), and payment processing (Paystack). Each provider adheres to strict privacy and data security compliance standards.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Your Rights & Data Export</h2>
            <p>
              You retain ownership of all customer lists, measurement files, and product catalogs stored in your account. You can update your details or request account closure at any time by contacting{" "}
              <a href="mailto:privacy@tryvendra.ng" className="text-brand-700 hover:underline">
                privacy@tryvendra.ng
              </a>.

            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

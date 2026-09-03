import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Terms of Service | Vendra",
  description: "Terms and conditions governing the use of the Vendra platform for fashion vendors.",
};

export default function TermsPage() {
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
            <Shield size={20} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            Terms of Service
          </h1>
        </div>

        <p className="text-sm text-gray-500 mb-8 pb-4 border-b border-gray-100">
          Last updated: August 31, 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm sm:text-base leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Agreement to Terms</h2>
            <p>
              By creating an account, accessing, or using the Vendra platform (&quot;Vendra&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree to all terms, you must discontinue use of the platform immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              Vendra is a specialized commerce management platform designed for Nigerian and African fashion businesses. Our software provides tools for inventory tracking, customer relationship management (CRM), bespoke demand and tailoring order recording, supplier debt management, analytics, and branded online storefronts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Account Registration and Security</h2>
            <p>
              You must provide accurate, current, and complete information during registration. You are responsible for safeguarding your password and session credentials. You agree to notify us immediately of any unauthorized access to your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Vendor Responsibilities & Conduct</h2>
            <p>
              As a vendor on Vendra, you are solely responsible for:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>The legality, quality, and fulfillment of all garments, ready-made items, and bespoke tailoring orders sold to your customers.</li>
              <li>Honoring customer deposits, delivery timelines, and stated return or adjustment policies.</li>
              <li>Respecting intellectual property rights and customer personal data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Subscriptions and Payments</h2>
            <p>
              Certain features on Vendra require a paid subscription. Billing is processed through authorized payment partners (including Paystack). Subscription fees are billed in advance on a recurring monthly or annual basis. You may cancel your subscription at any time via your dashboard settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Limitation of Liability</h2>
            <p>
              Vendra provides the software on an &quot;as is&quot; and &quot;as available&quot; basis. We are not liable for direct disputes, payment disagreements, or logistics delays between vendors and their individual customers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Contact Us</h2>
            <p>
              If you have any questions regarding these Terms, please reach out to us at{" "}
              <a href="mailto:legal@tryvendra.ng" className="text-brand-700 hover:underline">
                legal@tryvendra.ng
              </a>{" "}

              or via our{" "}
              <Link href="/contact" className="text-brand-700 hover:underline">
                Contact Page
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

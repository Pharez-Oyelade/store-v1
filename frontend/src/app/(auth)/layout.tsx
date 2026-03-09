import Link from "next/link";
import { Store } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-gray-50 via-brand-50 to-gray-100">
      {/* Logo */}
      <Link
        href="/"
        className="fixed top-0 left-0 w-full z-50 px-20 py-2 bg-white/50 backdrop-blur-sm font-bold text-2xl text-gray-900 mb-8"
      >
        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-700 text-white">
          <Store size={20} />
        </span>
        Sabi<span className="text-brand-700">Store</span>
      </Link>

      {/* Auth card */}
      <div className="w-full h-screen bg-white rounded-xl shadow-raised border border-gray-100">
        {children}
      </div>

      {/* Marketing footer */}
      <p className="mt-8 text-xs text-gray-400 text-center py-12">
        &copy; {new Date().getFullYear()} SabiStore &middot;{" "}
        <Link href="/privacy" className="hover:text-gray-600 transition-colors">
          Privacy
        </Link>{" "}
        &middot;{" "}
        <Link href="/terms" className="hover:text-gray-600 transition-colors">
          Terms
        </Link>
      </p>
    </div>
  );
}

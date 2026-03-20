"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", icon: "🏠", label: "Dashboard" },
  { href: "/tracker", icon: "💸", label: "Tracker" },
  { href: "/archive", icon: "📦", label: "Archive" },
  { href: "/analytics", icon: "📊", label: "Analytics" },
  { href: "/categories", icon: "🏷️", label: "Categories" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-slate-900 flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-700">
        <h1 className="text-white font-bold text-lg leading-tight">
          Household
          <span className="block text-blue-400 text-sm font-normal">Finance Tracker</span>
        </h1>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700">
        <p className="text-slate-500 text-xs">
          {new Date().getFullYear()} &bull; Finance Tracker
        </p>
      </div>
    </aside>
  );
}

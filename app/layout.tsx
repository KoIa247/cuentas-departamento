import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Household Finance Tracker",
  description: "Track your household spendings and earnings",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <main className="ml-60 min-h-screen">
          <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
        </main>
      </body>
    </html>
  );
}

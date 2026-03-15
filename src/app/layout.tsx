import type { Metadata } from "next";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "BidanApp - Doctor In Your Pocket",
  description: "Easy consultation with a doctor in your pocket. Say yes to your good health!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-100 flex justify-center font-sans">
        {/* Global Mobile App Container */}
        <div className="w-full max-w-md min-h-[100dvh] bg-white shadow-xl overflow-hidden relative flex flex-col">
          <main className="flex-1 flex flex-col overflow-y-auto">
            {children}
          </main>
          {/* Navigasi Bawah Otomatis by Pathname */}
          <BottomNavBar />
        </div>
      </body>
    </html>
  );
}

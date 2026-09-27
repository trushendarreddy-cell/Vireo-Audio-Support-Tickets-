import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vireo Audio — Support Intelligence",
  description: "Enterprise customer support operations, CX health, and grounded analytical intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans selection:bg-emerald-500/30 selection:text-white antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Explain My Report",
  description:
    "Plain-language explanations of medical reports. Educational only — not medical advice, not a diagnosis.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

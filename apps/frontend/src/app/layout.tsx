/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warpala Expo Platform",
  description: "Production-ready UE 5.7 Pixel Streaming",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

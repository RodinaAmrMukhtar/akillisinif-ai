import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AkıllıSınıf AI",
  description:
    "Yapay zekâ destekli sınıf performans takip ve erken uyarı sistemi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
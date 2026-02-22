import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "WorldMillion | Web3 Planet Conquest Game",
  description: "The ultimate hybrid Web3 lottery. Buy a $5 parcel on WorldMillion, invite friends, and win up to $500,000 USDT. Powered by Fort-Knox Architecture on BNB Smart Chain.",
  keywords: ["web3", "lottery", "crypto", "planet", "game", "USDT", "bsc", "bnb"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

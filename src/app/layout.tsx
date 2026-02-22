import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "El Continente del Millón | Web3 Conquest Game",
  description: "The ultimate hybrid Web3 lottery. Buy a $5 pixel parcel, invite friends, and win up to $1,250,000 USDC. Powered by Chainlink VRF on Polygon.",
  keywords: ["web3", "lottery", "crypto", "pixel", "game", "USDC", "polygon"],
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

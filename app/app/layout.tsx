import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { WalletContextProvider } from "./components/WalletProvider";
import { AuthProvider } from "./components/AuthProvider";
import { Navbar } from "./components/Navbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ZKFL - ZK Fantasy Football",
  description: "Private fantasy football on Aleo. Draft your team, prove your score in ZK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WalletContextProvider>
          <AuthProvider>
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 py-6">
              {children}
            </main>
          </AuthProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}

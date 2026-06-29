import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VibeShare — your vibecoded projects",
  description:
    "A home for all your vibecoded projects. Show off what you want, keep the rest private.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-10">
          {children}
        </main>
        <footer className="mt-8 border-t border-border py-8 text-center text-sm text-muted">
          VibeShare · a home for your vibecoded projects
        </footer>
      </body>
    </html>
  );
}

import { Inter } from "next/font/google";
import "./globals.css";
import HeaderAuth from "@/components/header-auth";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "splitr",
  description: "The smartest way split the expenses with friends",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logos/logo-s.png" sizes="any" />
      </head>
      <body className={`${inter.className}`} suppressHydrationWarning>
        <ClerkProvider>
          <ConvexClientProvider>
            <HeaderAuth />  
            <main className="min-h-screen">{children}</main>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

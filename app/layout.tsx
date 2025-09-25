import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConvexClerkProvider from "@/components/ConvexProviderWithClerk";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RANKORA AI - AI-Powered SEO Analysis & Reports",
  description: "Generate comprehensive SEO reports in seconds using advanced AI analysis. Get insights on keywords, competitors, and ranking opportunities. Start free today!",
  keywords: "SEO analysis, AI reports, keyword research, competitor analysis, ranking insights, SEO tools",
  authors: [{ name: "RANKORA AI" }],
  openGraph: {
    title: "RANKORA AI - AI-Powered SEO Analysis & Reports",
    description: "Generate comprehensive SEO reports in seconds using advanced AI analysis. Get insights on keywords, competitors, and ranking opportunities.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <ConvexClerkProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Header />
              {children}
              <Footer />
            </ThemeProvider>
          </ConvexClerkProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { AuthProvider } from "@/contexts/AuthContext";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FirstCareerSteps - Build Your Professional Resume",
  description:
    "Build a professional resume with our AI-powered builder. Perfect for students and first-time job seekers. Download your resume as PDF for just $1.99/year.",
  keywords: [
    "student resume",
    "resume builder",
    "career builder",
    "first job",
    "student career",
    "resume PDF",
  ],
  authors: [{ name: "FirstCareerSteps" }],
  creator: "FirstCareerSteps",
  openGraph: {
    title: "FirstCareerSteps - Build Your Professional Resume",
    description:
      "Build a professional resume in under 10 minutes. Download as PDF for $1.99/year.",
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1E88E5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body className="min-h-screen">
        <AuthProvider>
          <ProfileProvider>{children}</ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


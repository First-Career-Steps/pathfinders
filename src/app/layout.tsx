import '../../public/learning-assets/slides.css';
import type { Metadata, Viewport } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { CampaignCapture } from "@/components/CampaignCapture";
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
  metadataBase: new URL("https://www.firstcareersteps.com"),
  title: "First Career Steps | Workplace Learning and Resume Builder",
  description:
    "Practice AI and leadership skills through interactive courses and assessments, prepare for an interview, or build your first resume.",
  keywords: [
    "interactive AI courses",
    "leadership assessments",
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
    title: "First Career Steps | Workplace Learning and Resume Builder",
    description:
      "Explore student AI classes, leadership courses and assessments, and the First Career Steps Resume Builder.",
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1E88E5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <head><link rel="stylesheet" href="/learning-assets/course-nav.css" /></head>
      <body className="min-h-screen">
        <CampaignCapture />
        <AuthProvider>
          <ProfileProvider>{children}</ProfileProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


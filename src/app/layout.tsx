import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL("https://blueprintai.local"),
  title: {
    default: "BlueprintAI — Premium Sketch to Code Studio",
    template: "%s — BlueprintAI",
  },
  description:
    "Turn hand-drawn wireframes into polished React + Tailwind or HTML/CSS websites with Gemini vision, live preview, Monaco editing, and ZIP export.",
  keywords: [
    "AI sketch to code",
    "Next.js",
    "React",
    "Tailwind CSS",
    "Gemini Vision",
    "wireframe converter",
    "student web engineering project",
  ],
  authors: [{ name: "BlueprintAI" }],
  openGraph: {
    title: "BlueprintAI — Premium Sketch to Code Studio",
    description:
      "Upload a wireframe, generate frontend code, refine with AI, preview live, and export a complete project.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#02040a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <AuthProvider>
          <div className="relative z-10 min-h-screen">
            <Navbar />
            <main className="relative z-10">{children}</main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(8, 17, 31, 0.88)",
                backdropFilter: "blur(18px)",
                border: "1px solid rgba(255, 255, 255, 0.10)",
                color: "#eef5ff",
                borderRadius: "1rem",
                boxShadow: "0 20px 70px rgba(0, 0, 0, 0.38)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}

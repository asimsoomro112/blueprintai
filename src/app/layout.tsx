import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "BlueprintAI — Sketch to Web Code Converter",
  description: "Turn hand-drawn wireframes into production-ready React and HTML/CSS code using AI vision technology.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-[#030712] relative">
        {/* Subtle dot grid overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <AuthProvider>
          <Navbar />
          <main className="relative z-10">{children}</main>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "#f1f5f9",
                borderRadius: "1rem",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}

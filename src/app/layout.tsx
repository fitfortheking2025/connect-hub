import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SplashScreen from "./components/SplashScreen";
import InstallPrompt from "./components/InstallPrompt";

const font = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"] 
});

export const metadata: Metadata = {
  title: "Connect Hub | Discipleship Ministry",
  description: "Connect Ministry & First-Timers Discipleship Hub",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Connect Hub",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF7A00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${font.className} bg-[#F4F6FA] text-[#1E2640] min-h-screen antialiased selection:bg-[#FF6B00] selection:text-white`}>
        <SplashScreen />
        {children}
        {/* This component is for installing in the phone */}
        <InstallPrompt />
      </body>
    </html>
  );
}
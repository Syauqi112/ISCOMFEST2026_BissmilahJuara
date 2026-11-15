import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RumahHemat",
  description: "Pendamping hemat listrik dan air untuk rumah tangga.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster theme="light" position="top-center" />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Anton, Poppins } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jahuga",
  description: "Minijuegos entre amigos. Retá, apostá y ganá.",
};

export const viewport: Viewport = {
  themeColor: "#070d1f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${poppins.variable} ${anton.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

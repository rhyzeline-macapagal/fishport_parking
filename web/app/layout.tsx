import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../components/AuthProvider";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage-grotesque",
});

export const metadata: Metadata = {
  title: "Mercedes Municipal Fishport Parking System",
  description: "Reusable QR card parking management system",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={bricolageGrotesque.variable}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

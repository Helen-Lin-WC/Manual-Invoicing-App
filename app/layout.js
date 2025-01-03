import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Invoicing",
  description: "A manual invoicing app developed for Whitecap Resources",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
    <head />
    <body className="flex flex-col min-h-screen bg-gray-100">
      <Navbar />
      <main className={`${inter.className} flex flex-grow`}>{children}</main>
      <Footer/>
    </body>
  </html>
  );
}

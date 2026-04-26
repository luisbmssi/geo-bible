import type { Metadata } from "next";
import { Playfair_Display, EB_Garamond } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"]
});

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["400", "500"]
});

export const metadata: Metadata = {
  title: "O Escriba da Bíblia",
  description: "Exemplar manuscrito único, destinado a cada município do Brasil.",
  icons: {
    icon: "https://static.wixstatic.com/media/ba19e7_fcc5e75a524e4d3da8772097f72b29ba%7Emv2.jpg/v1/fill/w_32%2Ch_32%2Clg_1%2Cusm_0.66_1.00_0.01/ba19e7_fcc5e75a524e4d3da8772097f72b29ba%7Emv2.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${garamond.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

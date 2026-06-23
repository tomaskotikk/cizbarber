import type { Metadata } from "next";
import "@fontsource/red-hat-display/400.css";
import "@fontsource/red-hat-display/500.css";
import "@fontsource/red-hat-display/600.css";
import "@fontsource/red-hat-display/700.css";
import "@fontsource/red-hat-display/800.css";
import "@fontsource/red-hat-display/900.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cíž Barber | Moderní barber shop",
  description: "Rezervace střihu, vousů a kompletní péče v Cíž Barber.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="cs"><body>{children}</body></html>;
}

import type { Metadata } from "next";
import "./globals.css";
import "./components/listings.css";
import "./components/auth/auth.css";
export const metadata: Metadata = {
  title: "ApnaProperty | Find a place to call your own",
  description: "Explore homes, apartments, villas, land and commercial properties across India. Find your next chapter with ApnaProperty.",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}

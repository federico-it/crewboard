import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crewboard · WebMCP spike",
  description: "One read-only WebMCP tool with fictional attendance data.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

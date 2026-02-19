import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Bluesky Link Card Backend",
  description: "tRPC backend for the Bluesky link card browser extension"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { cssVariableTokens } from "@bidayax/tokens";
import "./globals.css";

export const metadata: Metadata = {
  title: "BidayaX Executive Cards",
  description: "Luxury executive digital business cards for BidayaX LLC."
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className="bg-surface-canvas font-body text-content-primary antialiased"
        style={cssVariableTokens as CSSProperties}
      >
        {children}
      </body>
    </html>
  );
}

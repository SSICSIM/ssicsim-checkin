import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "SSICSIM Check-in",
  description: "Check in to SSICSIM events.",
  robots: { index: false, follow: false }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3d2b00"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main className="page">
          <div className="brand">
            <img src="/GoldLogo.png" alt="SSICSIM" />
            <span>Event Check-in</span>
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}

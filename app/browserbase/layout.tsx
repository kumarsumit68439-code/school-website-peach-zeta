import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Chrome Browser | MGGEMS School",
  description: "Mobile Chrome-style browser and Browserbase cloud session",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#202124",
};

export default function BrowserbaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-[100dvh] bg-[#202124]">{children}</div>;
}

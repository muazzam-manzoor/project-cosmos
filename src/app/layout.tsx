import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Cosmos — Shell 1A+1B | Earth, LEO, MEO, GEO & Magnetosphere (0 → 40,000 km)",
  description:
    "Real-time 3D/4D Cosmic Intelligence & Multi-Disciplinary Space Learning Platform — Earth, ISS Exterior & Interior Cutaway, Live LEO/MEO GNSS/GEO Satellites, Volumetric Van Allen Belts, NOAA Magnetosphere, Hohmann Transfer & Gemini AI Spatial Commander.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cache } from "react";
import { mediaUrl } from "@/lib/format";
import { localized, resolveLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { defaultSettings } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

const getMetadataSettings = cache(() =>
  prisma.siteSettings.findUnique({
    where: { id: "site" },
    select: {
      defaultLocale: true,
      languageMode: true,
      siteName: true,
      siteNameEn: true,
      siteNameNl: true,
      faviconMediaId: true,
    },
  }),
);

export async function generateMetadata(): Promise<Metadata> {
  const settings = (await getMetadataSettings()) ?? defaultSettings;
  const locale = resolveLocale(
    undefined,
    settings.defaultLocale,
    settings.languageMode,
  );
  const siteName = localized(
    locale,
    settings.siteNameEn,
    settings.siteNameNl,
    settings.siteName,
  );
  const favicon = mediaUrl(settings.faviconMediaId) ?? "/default-favicon.ico";

  return {
    title: siteName,
    description: `The official website of ${siteName}.`,
    icons: {
      icon: favicon,
      shortcut: favicon,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = (await getMetadataSettings()) ?? defaultSettings;
  const documentLocale = resolveLocale(
    undefined,
    settings.defaultLocale,
    settings.languageMode,
  );

  return (
    <html
      lang={documentLocale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

const siteUrl = "https://uxdotsol.xyz";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "UX.SOL",
  title: "UX.SOL - Experience layer for Solana",
  description:
    "Open-source, shadcn-compatible components, hooks, flows, and templates for Solana wallets, transactions, tokens, payments, and assets.",
  alternates: { canonical: "/" },
  authors: [{ name: "UX.SOL", url: "https://github.com/ajeeshRS/uxdotsol" }],
  creator: "UX.SOL",
  publisher: "UX.SOL",
  category: "Developer Tools",
  keywords: [
    "Solana",
    "React",
    "Next.js",
    "shadcn",
    "component library",
    "dApp UI",
    "wallet UX",
  ],
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/uxsol-logo-on-light.png", media: "(prefers-color-scheme: light)" },
      { url: "/uxsol-logo-on-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/uxsol-logo-on-light.png",
  },
  openGraph: {
    title: "UX.SOL - Experience layer for Solana",
    description:
      "Open-source, shadcn-compatible components, hooks, flows, and templates for building Solana product experiences.",
    siteName: "UX.SOL",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "UX.SOL - Experience layer for Solana",
    description:
      "Open-source, shadcn-compatible components, hooks, flows, and templates for building Solana product experiences.",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "UX.SOL",
      alternateName: "UX dot SOL",
      url: siteUrl,
      description:
        "Open-source, shadcn-compatible components, hooks, flows, and templates for Solana product experiences.",
      inLanguage: "en",
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": `${siteUrl}/#source`,
      name: "UX.SOL",
      description:
        "A source-distributed UI and interaction registry for Solana applications.",
      url: siteUrl,
      codeRepository: "https://github.com/ajeeshRS/uxdotsol",
      license: "https://opensource.org/license/mit",
      programmingLanguage: ["TypeScript", "TSX"],
      runtimePlatform: ["Next.js 16", "React 19"],
      isAccessibleForFree: true,
      mainEntityOfPage: { "@id": `${siteUrl}/#website` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <Navbar />
          <main
            id="main-content"
            tabIndex={-1}
            className="flex flex-1 flex-col"
          >
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}

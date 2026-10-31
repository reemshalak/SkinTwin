import type { Metadata, Viewport } from "next";
import { Fraunces, Poppins } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import { MotionProvider } from "@/components/motion";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { StoreProvider } from "@/lib/store";
import { THEME_SCRIPT, ThemeProvider } from "@/lib/theme";
import "./globals.css";

const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SkinTwin",
  description: "See what actually worked for people whose skin measures like yours.",
  appleWebApp: { capable: true, title: "SkinTwin", statusBarStyle: "default" },
  icons: { icon: "/pwa-icon/192", apple: "/pwa-icon/180" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6edf3",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${poppins.variable} ${fraunces.variable} font-sans antialiased`}>
        <ThemeProvider>
        <I18nProvider>
        <MotionProvider>
          <StoreProvider>
            <AuthProvider>
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </StoreProvider>
        </MotionProvider>
        </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

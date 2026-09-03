import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ConditionalChat } from "@/components/conditional-chat";
import { BackgroundLayer } from "@/components/bg-theme";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const urdu = Noto_Nastaliq_Urdu({ variable: "--font-urdu", subsets: ["arabic"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "WealthWise AI - Apne Paise Ka Bhavishya Pehle Se Dekho",
  description: "Pakistan ka pehla AI-powered Financial Digital Twin. Har faisla test karo, har risk pehle se samjho.",
  icons: { icon: '/favicon.svg' },
};

// Inline script to prevent white flash — applies theme before first paint
const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('theme') || 'dark';
    var el = document.documentElement;
    if (theme === 'dark') {
      el.classList.add('dark');
      el.style.colorScheme = 'dark';
    } else {
      el.classList.remove('dark');
      el.style.colorScheme = 'light';
    }
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${urdu.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <BackgroundLayer />
          {children}
          <ConditionalChat />
        </ThemeProvider>
      </body>
    </html>
  );
}

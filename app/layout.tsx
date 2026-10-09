import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Poppins } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { GeminiChatbot } from "@/components/gemini-chatbot"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
})

export const metadata: Metadata = {
  title: "Jazgot Tour Services | El Nido Island Hopping Tours",
  description:
    "Discover handpicked El Nido island hopping tours and unforgettable Palawan adventures with Jazgot Tour Services.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased bg-page", geist.variable, poppins.variable, "font-sans")}
    >
      <body className="bg-page">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <GeminiChatbot />
          </AuthProvider>
        </ThemeProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}

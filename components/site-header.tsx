import Link from "next/link"
import { AuthHeaderAction } from "@/components/auth-header-action"
import { Logo } from "@/components/logo"

const navLinks = [
  { href: "/about", label: "ABOUT" },
  { href: "/contact", label: "CONTACT" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-brand text-primary-foreground">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <span className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm">
            {/* New SVG Logo (Icon Only) */}
            <Logo showText={false} className="size-10" />
          </span>
          <span className="leading-tight text-primary-foreground">
            <span className="block font-heading text-lg font-bold">Jazgot</span>
            <span className="block text-xs font-medium opacity-90">Tour Services</span>
          </span>
        </Link>

        {/* Center nav */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold tracking-wide text-primary-foreground/95 transition-opacity hover:opacity-80"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Sign in / Mobile Nav */}
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-5 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-semibold tracking-wide text-primary-foreground/95 hover:opacity-80 transition-opacity"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <AuthHeaderAction />
        </div>
      </div>
    </header>
  )
}
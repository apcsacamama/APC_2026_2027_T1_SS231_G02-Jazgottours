import type { Metadata } from "next"

import { SiteShell } from "@/components/site-shell"
import { ContactForm } from "@/components/contact-form"
import { MapPin, Mail, Phone, Clock } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact | Jazgot Tour Services",
  description: "Get in touch with Jazgot Tour Services to book your El Nido island hopping tour.",
}

const details = [
  { icon: MapPin, label: "Address", value: "The King's City, Paranaque, Parañaque, 1700 Metro Manila" },
  { icon: Phone, label: "Phone", value: "+63 918 934 5403" },
  { icon: Mail, label: "Email", value: "hello@jazgottours.com" },
  { icon: Clock, label: "Hours", value: "Daily, 6:00 AM - 8:00 PM" },
]

export default function ContactPage() {
  return (
    <SiteShell>
      <section className="bg-brand px-4 py-12 text-center text-primary-foreground sm:px-6">
        <h1 className="font-heading text-4xl font-extrabold sm:text-5xl">Contact Us</h1>
        <p className="mx-auto mt-2 max-w-lg text-pretty text-primary-foreground/90">
          Have a question or ready to book? We&apos;d love to hear from you.
        </p>
      </section>

      <section className="bg-background px-4 py-12 sm:px-6">
        <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Get in touch</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Reach out through any of the channels below, or send us a message and our team will
              get back to you within 24 hours.
            </p>

            <ul className="mt-8 flex flex-col gap-5">
              {details.map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent">
                    <item.icon className="size-5 text-primary" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.value}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <ContactForm />
        </div>
      </section>
    </SiteShell>
  )
}

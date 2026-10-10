import Image from "next/image"
import type { Metadata } from "next"
import { User, HeartHandshake, ShieldCheck } from "lucide-react"

import { SiteShell } from "@/components/site-shell"

export const metadata: Metadata = {
  title: "About | Jazgot Tour Services",
  description:
    "Learn about Jazgot Tour Services, your local El Nido island hopping experts in Palawan, Philippines.",
}

const values = [
  {
    icon: User,
    title: "For Our Clients",
    body: "To enjoy the beauty of nature, understand the history of the place as well as the relaxation they want to achieve, relieve stress/anxiety, and take a moment for a lifetime to remember their dream destinations.",
  },
  {
    icon: ShieldCheck,
    title: "For Co-Tour Operators/Companies",
    body: "To share one goal to uplift the tourism industry of our country and other countries — and to help the economy as a way to be shock-proof in an economic recession.",
  },
  {
    icon: HeartHandshake,
    title: "For Future Tourism Professionals",
    body: "To help graduating students of BS in Tourism Management grasp the quality of being a Travel Agent — teaching professional ethics and instilling honesty and love for the job.",
  },
]

export default function AboutPage() {
  return (
    <SiteShell>
      <section className="relative h-56 w-full sm:h-72">
        <Image
          src="/hero-lagoon.png"
          alt="El Nido Big Lagoon"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <h1 className="font-heading text-4xl font-extrabold text-white drop-shadow sm:text-5xl">
            About Us
          </h1>
          <p className="mt-2 max-w-lg text-pretty text-white/90 drop-shadow">
            Let's have a break from our busy schedule, and unwind once in a while, enjoy life and recharge!
          </p>
        </div>
      </section>

      <section className="bg-background px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-heading text-2xl font-bold text-foreground">Our Story</h2>
          <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <p>
              Jazgot Tour Services was founded with a simple mission: to share the breathtaking
              beauty of El Nido, Palawan with travelers from around the world. What started as a
              single boat and a handful of passionate local guides has grown into one of the
              region&apos;s most trusted island hopping operators.
            </p>
            <p>
              We specialize in curated island hopping tours across the pristine waters of the
              Bacuit Archipelago, taking you to secret beaches, hidden lagoons, dramatic limestone
              cliffs, and vibrant coral reefs. Every itinerary is designed to balance adventure,
              relaxation, and authentic Filipino hospitality.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border border-border bg-card p-5 text-card-foreground"
              >
                <span className="flex size-11 items-center justify-center rounded-lg bg-accent">
                  <value.icon className="size-5 text-primary" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-heading text-base font-semibold">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{value.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
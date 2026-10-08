export type Tour = {
  id: string
  title: string
  description: string
  destinations: number
  originalPrice: number
  price: number
  image: string
}

export const heroSlides = [
  {
    title: "EL NIDO",
    subtitle: "Amazing Secret Beach around El Nido",
    image: "/hero-el-nido.png",
  },
  {
    title: "BIG LAGOON",
    subtitle: "Glide through emerald waters between towering cliffs",
    image: "/hero-lagoon.png",
  },
  {
    title: "ISLAND HOPPING",
    subtitle: "Discover hidden islands and pristine sandbars",
    image: "/hero-islands.png",
  },
]

export function formatPeso(value: number) {
  return `\u20B1 ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS destination_details text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS inclusions text NOT NULL DEFAULT '';

UPDATE public.packages
SET
  destination_details = CASE
    WHEN destination_details = '' THEN E'Big Lagoon: Kayaking activity where you can go around 800 meters to 1 kilometer inside to see the clear water of the lagoon.\nSecret Lagoon: There is a small entrance to go inside and see beautiful rock formations that look like a crocodile head, eagle head, and more.\nSnorkeling spot: See the coral and a lot of fish in clear water.\nShimizu Island: A clear-water beach where you can eat lunch and snorkel along the shores.\nSeven Commandos Beach: A clean white-sand beach where you can relax, play volleyball, sunbathe, snorkel, swim, and buy drinks and snacks.'
    ELSE destination_details
  END,
  inclusions = CASE
    WHEN inclusions = '' THEN E'Buffet lunch\nLicensed tour guide\nBoat transfer\nDrinking water\nEl Nido ETDF (required)\nLagoon entrance fee (required where applicable)'
    ELSE inclusions
  END
WHERE destination_details = '' OR inclusions = '';
UPDATE public.packages
SET
  destination_details = CASE
    WHEN destination_details = '' OR destination_details = E'Big Lagoon: Kayak through clear water for around 800 meters to 1 kilometer.\nSecret Lagoon: Enter through a small opening and explore the surrounding rock formations.\nSnorkeling spot: See coral and tropical fish in clear water.\nShimizu Island: Swim, snorkel, and enjoy lunch by the beach.\nSeven Commandos Beach: Relax, swim, snorkel, or enjoy the white-sand beach.'
    THEN E'Big Lagoon: Kayaking activity where you can go around 800 meters to 1 kilometer inside to see the clear water of the lagoon.\nSecret Lagoon: There is a small entrance to go inside and see beautiful rock formations that look like a crocodile head, eagle head, and more.\nSnorkeling spot: See the coral and a lot of fish in clear water.\nShimizu Island: A clear-water beach where you can eat lunch and snorkel along the shores.\nSeven Commandos Beach: A clean white-sand beach where you can relax, play volleyball, sunbathe, snorkel, swim, and buy drinks and snacks.'
    ELSE destination_details
  END,
  inclusions = CASE
    WHEN inclusions = '' OR inclusions = E'Buffet lunch\nLicensed tour guide\nBoat transfer\nDrinking water\nEl Nido ETDF (required)\nLagoon entrance fee (required where applicable)'
    THEN E'Buffet lunch\nLicensed tour guide\nBoat transfer\nDrinking water\nEl Nido ETDF (required)\nLagoon entrance fee (required where applicable)'
    ELSE inclusions
  END
WHERE destination_details = ''
  OR destination_details = E'Big Lagoon: Kayak through clear water for around 800 meters to 1 kilometer.\nSecret Lagoon: Enter through a small opening and explore the surrounding rock formations.\nSnorkeling spot: See coral and tropical fish in clear water.\nShimizu Island: Swim, snorkel, and enjoy lunch by the beach.\nSeven Commandos Beach: Relax, swim, snorkel, or enjoy the white-sand beach.'
  OR inclusions = '';
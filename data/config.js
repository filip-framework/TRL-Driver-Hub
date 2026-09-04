/* =============================================================
   TRL Driver Hub — League configuration
   Everything brand/league specific lives here. Edit freely.
   ============================================================= */
window.TRL_CONFIG = {
  league: {
    name: "TRL",
    fullName: "TRL Driver Hub",
    tagline: "Where the grid comes to race.",
    description:
      "TRL is a competitive, clean-racing F1 league running multiple tiers every week. Fair stewarding, full broadcasts, real championships.",
    established: 2024,
    game: "F1 25",
    platforms: ["PC", "PlayStation", "Xbox"],
    email: "admin@example.com",
    discordInvite: "https://discord.gg/your-invite-code",
    socials: {
      discord: "https://discord.gg/your-invite-code",
      twitch: "https://twitch.tv/your-channel",
      youtube: "https://youtube.com/@your-channel",
      twitter: "https://x.com/your-handle",
      instagram: "https://instagram.com/your-handle",
      tiktok: "https://tiktok.com/@your-handle"
    },
    // Twitch channel used for the live embed. Leave empty to hide the stream block.
    twitchChannel: "your-channel"
  },

  // Where the sign-up and incident forms send their data.
  // - discordWebhook: a Discord channel webhook URL (recommended, no backend needed)
  // - formEndpoint:   any endpoint that accepts a JSON POST (Formspree, Netlify, your own API)
  // If both are empty, the forms fall back to a pre-filled mailto: link.
  forms: {
    registration: { discordWebhook: "", formEndpoint: "" },
    incident: { discordWebhook: "", formEndpoint: "" }
  },

  pointsSystems: {
    f1: {
      label: "Standard F1",
      race: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1],
      sprint: [8, 7, 6, 5, 4, 3, 2, 1],
      fastestLap: 1,
      fastestLapTop10Only: true,
      pole: 0
    },
    extended: {
      label: "Extended (top 15)",
      race: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0, 0, 0, 0],
      sprint: [8, 7, 6, 5, 4, 3, 2, 1],
      fastestLap: 1,
      fastestLapTop10Only: true,
      pole: 1
    }
  },

  // Licence / penalty points
  penaltyPoints: {
    raceBanAt: 12,
    warningAt: 8,
    expiryRounds: 12
  },

  staff: [
    { name: "League Director", role: "Founder & Director", handle: "director" },
    { name: "Head Steward", role: "Chief Steward", handle: "steward" },
    { name: "Broadcast Lead", role: "Commentary & Streams", handle: "broadcast" },
    { name: "Community Manager", role: "Discord & Onboarding", handle: "community" }
  ],

  partners: [
    { name: "Partner One", url: "#" },
    { name: "Partner Two", url: "#" },
    { name: "Partner Three", url: "#" },
    { name: "Partner Four", url: "#" }
  ],

  faq: [
    {
      q: "How do I join the league?",
      a: "Fill in the registration form on the Register page and join our Discord. An admin will confirm your placement (tier and team) and you will get access to the drivers' channels."
    },
    {
      q: "Which platform and game do you race on?",
      a: "We run on F1 25 with cross-play enabled, so PC, PlayStation and Xbox drivers all race together in the same lobbies."
    },
    {
      q: "Do I need a wheel?",
      a: "No. Pad and wheel drivers are both welcome and race together. Clean, consistent driving matters far more than the input device."
    },
    {
      q: "What happens if I miss a race?",
      a: "Let the admins know in Discord at least 24 hours in advance so a reserve can be lined up. Repeated no-shows without notice may lead to your seat being reassigned."
    },
    {
      q: "How does promotion and relegation work?",
      a: "At the end of each season the top drivers of each tier are offered promotion and the bottom drivers move down, subject to attendance and driving standards."
    },
    {
      q: "How do I report an incident?",
      a: "Use the incident report form on the Penalties page (or the stewards channel on Discord) within 48 hours of the race. Include the lap, the drivers involved and a clip or timestamp."
    }
  ]
};

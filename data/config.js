/* =============================================================
   TRL Driver Hub — league configuration
   Brand, ventures, Discord, forms, points, salary cap, licences.
   ============================================================= */
window.TRL_CONFIG = {
  brand: {
    name: "TRL",
    line1: "TRL",
    line2: "Driver Hub",
    fullName: "TRL Driver Hub",
    tagline: "Competition. Precision. Community.",
    version: "v1.0.0",
    heroLine1: "ONE LEAGUE.",
    heroLine2: "EVERY GRID.",
    description: "TRL runs competitive sim racing across Formula 1 and endurance. The F1 championship is the flagship league — live standings, schedule, and race control live here.",
    metaDescription: "Sim racing community for Formula 1 championship competition and endurance racing.",
    year: 2026
  },

  devBanner: {
    enabled: true,
    text: "TRL Driver Hub is currently in active development. Join our Discord server for the most up to date information.",
    linkText: "Join Discord ↗"
  },

  discord: {
    invite: "https://discord.gg/your-invite-code",
    // Optional: fill these in to enable "Sign in with Discord" (OAuth2 implicit grant, no backend needed).
    // Create an application at https://discord.com/developers, add the login page URL as a redirect, and paste the client id.
    clientId: "",
    guildId: "",
    roles: { teamPrincipal: "Team Principal", raceControl: "Race Control", steward: "Steward" }
  },

  f1: {
    code: "TRLF1",
    name: "TRL F1 Championship",
    shortName: "F1 Championship",
    raceNight: "Sunday nights",
    raceTime: "8:30 PM ET",
    heroLine1: "BUILT FOR THE",
    heroLine2: "LIMIT.",
    lede: "Lights out Sunday nights at 8:30 p.m. Eastern. Track standings, schedule, and constructor caps for the TRL Formula 1 league.",
    featureTitle: "Full league operations for TRL Formula 1",
    featureText: "salary-cap team management, race results, and Discord-linked race control. This is the primary product on the site.",
    rulebookSource: ""
  },

  endurance: {
    enabled: true,
    code: "Endurance",
    lede: "Club cars in iRacing and Le Mans Ultimate. 6H, 12H, 24H, and 1000km team races are the headline events. Mark interest, then the race desk covers cars, fuel, stints, and prep.",
    platforms: [
      { id: "iracing", name: "iRacing", title: "Endurance on the service", text: "Long-form TRL endurance events, team coordination, and community race nights on iRacing.", panelText: "Team driver-swap endurance — longer races, stint changes, pit strategy, and Discord-led coordination." },
      { id: "lmu", name: "Le Mans Ultimate", title: "Prototype & GT endurance", text: "TRL endurance competition in LMU — multi-class racing built for stamina and clean racecraft.", panelText: "Prototype and GT endurance with TRL. Multi-class racecraft lives here while the F1 championship stays the flagship." }
    ]
  },

  // Where forms send their data. Discord channel webhooks work without a backend.
  // Leave both empty to fall back to a pre-filled email.
  forms: {
    email: "admin@example.com",
    f1Signup: { discordWebhook: "", formEndpoint: "" },
    enduranceSignup: { discordWebhook: "", formEndpoint: "" },
    interest: { discordWebhook: "", formEndpoint: "" },
    office: { discordWebhook: "", formEndpoint: "" }
  },

  weather: { enabled: true, refreshMinutes: 20 },

  pointsSystems: {
    trl: {
      label: "TRL F1",
      race: [25, 23, 21, 19, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 5, 3, 1],
      bonuses: { pole: 1, fastestLap: 1, dotd: 1, mostGained: 1 },
      reservesScoreConstructors: false
    }
  },

  cap: {
    limit: 60,               // $M per constructor per season
    seatsPerTeam: 4,         // contract positions (2 per division)
    fullTimePerDivision: 2,
    reserveFee: 2,           // one-race reserve contract, $M
    waiverFee: 2,            // $M applied to the cap when a driver is waived
    performancePerPosition: 2, // $M per position finished above contract position
    performanceDivision: "d1",  // performance adjustments apply to contracts in this division only
    // Driver value by contract position (P1..P22), $M
    salaryTable: [30, 27, 25, 23, 21, 19, 18, 17, 16, 15, 14, 13.5, 12, 11.5, 10, 9.5, 8, 7.5, 6, 5.5, 4, 3],
    // Constructors' points deducted at season end for exceeding the cap
    overCapBrackets: [
      { upTo: 5, points: 5 },
      { upTo: 10, points: 15 },
      { upTo: 20, points: 30 },
      { upTo: Infinity, points: 50 }
    ]
  },

  licence: { activeMax: 7, provisionalMax: 11 }
};

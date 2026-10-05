// Every showcase piece is listed here; index.html renders the gallery from it.
// {
//   id: "hero-01",               unique
//   kind: "hero" | "section",
//   type: "Hero" | "Pricing" | "Features" | ...,
//   title: "Fictional brand / piece name",
//   industry: "Finance",
//   tags: ["WebGL", "GSAP", "RTL"],
//   path: "heroes/01-slug/",
//   accent: "#c9a96e",           card tint
//   summary: "One line on the idea."
// }
window.EMS_REGISTRY = [
  {
    id: "hero-01",
    kind: "hero",
    type: "Hero",
    title: "Surpay",
    industry: "Fintech",
    tags: ["SaaS", "Glassmorphism", "CSS motion", "3D tilt"],
    path: "heroes/01-surpay-fintech/",
    accent: "#8CA2BA",
    summary: "Slate-blue fintech hero where live payment cards rise out of an opened envelope."
  },
  {
    id: "hero-02",
    kind: "hero",
    type: "Hero",
    title: "FORMA Studio",
    industry: "Fashion",
    tags: ["Editorial", "Photo cutout", "SVG lens mask", "Frosted glass", "Parallax depth"],
    path: "heroes/02-forma-fashion/",
    accent: "#1B36A8",
    summary: "Giant MOOD wordmark where the two O's become frosted glass lenses over the model."
  },
  {
    id: "hero-03",
    kind: "hero",
    type: "Hero",
    title: "sync.ai",
    industry: "Productivity SaaS",
    tags: ["Bento grid", "Interactive cards", "Hand-drawn notes", "Keyboard aware"],
    path: "heroes/03-sync-ai/",
    accent: "#C8E2EC",
    summary: "Clean SaaS hero with a working bento deck: shuffle integrations, confirm meetings, press real shortcuts."
  },
  {
    id: "hero-04",
    kind: "hero",
    type: "Hero",
    title: "ORYN Nocturne",
    industry: "Automotive",
    tags: ["Dark studio", "SVG car", "Light sweep", "Live paint configurator"],
    path: "heroes/04-oryn-ev/",
    accent: "#b3311b",
    summary: "Luxury EV on a dark stage: a light band sweeps the paint, and swatches re-light the whole scene."
  },
  {
    id: "hero-05",
    kind: "hero",
    type: "Hero",
    title: "Sadeem Wealth",
    industry: "Wealth management",
    tags: ["Bilingual EN/AR", "RTL", "Canvas skyline", "Live chart", "Riyadh"],
    path: "heroes/05-sadeem-wealth/",
    accent: "#D4AF6A",
    summary: "A fund's performance line draws across the night sky and Riyadh rises to meet it, in English or Arabic."
  },
  {
    id: "hero-06",
    kind: "hero",
    type: "Hero",
    title: "Cusana CRM",
    industry: "B2B SaaS",
    tags: ["Browser mockup", "Inline metric card", "Live tabs", "Data pulses"],
    path: "heroes/06-cusana-crm/",
    accent: "#FF7A1A",
    summary: "CRM hero in a browser frame: a metric card inside the headline and a working three-node pipeline."
  },
  {
    id: "hero-07",
    kind: "hero",
    type: "Hero",
    title: "tandem",
    industry: "Fintech",
    tags: ["Coverflow deck", "Swipe", "Photo cards", "Glass chips"],
    path: "heroes/07-tandem-wallet/",
    accent: "#E2FA52",
    summary: "Shared-wallet hero with a swipeable coverflow of group pots, each with live payment chips."
  },
  {
    id: "hero-08",
    kind: "hero",
    type: "Hero",
    title: "Cloud.de",
    industry: "AI SaaS",
    tags: ["Painted sky", "Drifting clouds", "Glass prompt", "Streamed AI answers"],
    path: "heroes/08-cloud-de/",
    accent: "#62B2F2",
    summary: "Sky-and-hills AI platform hero with a working glass prompt card that streams answers."
  },
  {
    id: "hero-09",
    kind: "hero",
    type: "Hero",
    title: "Waitless",
    industry: "Community SaaS",
    tags: ["Two-tone headline", "Live activity cards", "Rank counter", "Striped stage"],
    path: "heroes/09-waitless/",
    accent: "#FF6154",
    summary: "Waitlist hero framed by tilted live cards: new sign-ups stream in and a referrer climbs the ranks."
  },
  {
    id: "hero-10",
    kind: "hero",
    type: "Hero",
    title: "Apex",
    industry: "Banking",
    tags: ["Phone mockup", "Pocket cards", "Live balance", "Floating widgets"],
    path: "heroes/10-apex-banking/",
    accent: "#2563EB",
    summary: "Banking hero with a working phone: tap pocket cards, hide the balance, top up and flip months on the chart."
  },
  {
    id: "dash-01",
    kind: "dashboard",
    type: "Dashboard",
    title: "Orbit Wallet",
    industry: "Fintech",
    tags: ["Multi-currency wallet", "Spline chart", "Quick transfer", "Live widgets"],
    path: "dashboards/01-fintech-wallet/",
    accent: "#5B7BFE",
    summary: "Soft-shaded fintech dashboard where every widget works: switch wallets, hover charts and send money into the ledger."
  },
  {
    id: "dash-02",
    kind: "dashboard",
    type: "Dashboard",
    title: "Nueansa",
    industry: "Accounting SaaS",
    tags: ["Bi-directional cash flow", "Searchable ledger", "AI insight gauge", "Period switching"],
    path: "dashboards/02-nueansa-accounting/",
    accent: "#FF5216",
    summary: "Warm ivory accounting dashboard: hover the day-by-day cash flow, filter the ledger and ask the AI insight card."
  },
  {
    id: "iot-01",
    kind: "iot",
    type: "IoT",
    title: "Sellution",
    industry: "Smart home",
    tags: ["Dark glassmorphism", "Live camera scene", "Drag gauges", "Solar chart"],
    path: "iot/01-sellution-smart-home/",
    accent: "#84CC16",
    summary: "Dark glass smart-home hub where room switches and the brightness gauge actually light up the house on camera."
  },
  {
    id: "auto-01",
    kind: "automation",
    type: "Automation",
    title: "Flowmint Builder",
    industry: "Workflow automation",
    tags: ["Node graph", "Drag & drop", "Orthogonal routing", "Undo / redo"],
    path: "automation/01-flowmint-builder/",
    accent: "#B4F535",
    summary: "Visual process builder: drag nodes and connectors re-route, drop elements from the palette, inspect and publish steps."
  },
  {
    id: "dash-03",
    kind: "dashboard",
    type: "Dashboard",
    title: "Finora",
    industry: "Wealth management",
    tags: ["Portfolio holdings", "4 live views", "Sortable table", "AI assistant"],
    path: "dashboards/03-finora-wealth/",
    accent: "#C0E800",
    summary: "Lime investment portfolio dashboard: switch list, chart, card and news views, sell or withdraw holdings, ask the AI assistant."
  },
  {
    id: "dash-04",
    kind: "dashboard",
    type: "Dashboard",
    title: "InsightOS",
    industry: "Sales analytics",
    tags: ["AI assistant orb", "Interactive donut", "Deal bars", "Light / dark theme"],
    path: "dashboards/04-insightos-sales/",
    accent: "#D0FF59",
    summary: "AI sales analytics board: switch themes and periods, hover the revenue donut, sort opportunities and chat with Bostie AI."
  }
];

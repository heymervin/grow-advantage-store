import { Settings, Star, HeartHandshake, MessageCircle, UserPlus, Wrench, type LucideIcon } from "lucide-react";

export interface Service {
  id: string;
  title: string;
  icon: LucideIcon;
  price: string;
  timeline: string;
  description: string;
  shortDescription?: string; // For compact card view
  features: string[];
  whatYouGet: string[];
  cta: string;
  ctaLink: string;
  badge?: string;
  priceHighlight?: "success" | "default";
  disabled?: boolean;
}

export const services: Service[] = [
  {
    id: "vip-day",
    title: "VIP Day Strategic Deepdive",
    icon: Star,
    price: "$2,997 AUD",
    timeline: "1 Day (90min + Build)",
    shortDescription: "A focused reset for when leadership, delivery, or team decisions feel urgent. Get decisions made, pressure reduced, and a structure that actually holds your business.",
    description: "You don't need more ideas. You need decisions made, pressure reduced, and a structure that actually holds your business. A VIP Day is a focused reset for when leadership, delivery, or team decisions feel urgent — and you want it fixed properly (not talked about for another six weeks).",
    features: [
      "90-minute strategy session to map what's happening and what's stuck",
      "Full service day of done-for-you work in your business",
      "Google Drive folder with clear recommendations and 12-month roadmap",
      "Hiring plan, revenue map, and org structure",
      "CEO role clarity and plug-and-play templates",
    ],
    whatYouGet: [
      "Perfect for: Coaches, educators, agencies, trades & service providers who can't keep up with demand",
      "Not for: Those still figuring out their offer or client base",
      "Only two VIP Days per month available",
      "Payment plans available",
    ],
    cta: "Book Your VIP Day Now",
    ctaLink: "https://links.growadvantage.com.au/widget/bookings/grow-advantage-vip-day",
    badge: "VIP",
  },
  {
    id: "operations-partnership",
    title: "Operations Partnership",
    icon: Settings,
    price: "Starting at $547 AUD per week",
    timeline: "Minimum 12-week engagement",
    shortDescription: "Your Business, Upgraded from the Inside Out. Get the strategy, delivery, and leadership that turn your business into a calm, scalable machine.",
    description: "When you've outgrown being your own operations manager, this is where we come in. You get the strategy, delivery, and leadership that turn your business into a calm, scalable machine — for a fraction of a full-time team cost.",
    features: [
      "Strategic COO Support for monthly vision + roadmap sessions",
      "Dedicated Integrator — your project-/OBM/account-manager hybrid running daily ops",
      "Team of Offshore Experts (tech VAs, automation, design, admin, video editors) managed for you",
    ],
    whatYouGet: [
      "Within 30 days: reclaim 10+ hours a week",
      "By 90 days: your business runs without you",
    ],
    cta: "Let's Map Your First 90 Days",
    ctaLink: "https://links.growadvantage.com.au/widget/bookings/sanity-call",
    badge: "MOST POPULAR",
  },
  {
    id: "leadership-support",
    title: "Leadership Support with Chrissy Elle",
    icon: HeartHandshake,
    price: "Starting at $799 AUD per month",
    timeline: "3 months minimum",
    shortDescription: "One-to-one thinking partnership for leaders and business owners. Somewhere to think clearly, make decisions, and deal with leadership as it actually shows up.",
    description: "One-to-one support for leaders and business owners is a true thinking partnership. This is for founders and people leaders who don't need another program, group call, or performance space. You need somewhere to think clearly, make decisions, and deal with leadership as it actually shows up — privately, honestly, and in real time.",
    features: [
      "Leadership load and responsibility creep",
      "Team dynamics, performance, and structure",
      "Decisions that affect your time, energy, income, and life",
      "Capacity, boundaries, and what your role needs to look like now",
    ],
    whatYouGet: [
      "No group calls",
      "No hype",
      "No theory without application",
      "Just ongoing, one-to-one support for the part of your work that has the biggest impact and the biggest cost — your leadership",
    ],
    cta: "Enquire About 1:1 Support",
    ctaLink: "https://links.growadvantage.com.au/widget/bookings/sanity-call",
  },
  {
    id: "strategy-sessions",
    title: "Strategy Sessions",
    icon: MessageCircle,
    price: "$497 AUD",
    timeline: "60 Minutes",
    shortDescription: "A 60 minute deep-dive to untangle a specific challenge or map a project. Perfect for founders who need clarity fast.",
    description: "A 60 minute deep-dive to untangle a specific challenge or map a project. Perfect for founders who need clarity fast.",
    features: [
      "Untangle a specific challenge",
      "Map a project",
      "Get clarity fast",
    ],
    whatYouGet: [
      "Deep-dive session",
      "Actionable next steps",
    ],
    cta: "Book Your Strategy Session",
    ctaLink: "https://links.growadvantage.com.au/widget/bookings/60min-strategy-session-chrissy-elle",
  },
  {
    id: "hiring-projects",
    title: "Hiring Projects",
    icon: UserPlus,
    price: "Custom Quote",
    timeline: "Project Based",
    shortDescription: "Done-for-you recruitment for Integrators, VAs, and delivery teams with role clarity and onboarding built in.",
    description: "Done-for-you recruitment for Integrators, VAs, and delivery teams with role clarity and onboarding built in.",
    features: [
      "Done-for-you recruitment",
      "Integrators, VAs, and delivery teams",
      "Role clarity included",
      "Onboarding built in",
    ],
    whatYouGet: [
      "Professional recruitment process",
      "Vetted candidates",
      "Time saved on hiring",
    ],
    cta: "Request a Quote",
    ctaLink: "https://links.growadvantage.com.au/widget/bookings/sanity-call",
  },
  {
    id: "operations-systems",
    title: "Operations & Systems Projects",
    icon: Wrench,
    price: "Custom Quote",
    timeline: "Project Based",
    shortDescription: "From CRM migrations to process audits and Tekmatix builds, we'll create systems that save time and headspace.",
    description: "From CRM migrations to process audits and Tekmatix builds, we'll create systems that save time and headspace.",
    features: [
      "CRM migrations",
      "Process audits",
      "Tekmatix builds",
      "System optimization",
    ],
    whatYouGet: [
      "Systems that save time",
      "More headspace",
      "Streamlined operations",
    ],
    cta: "Enquire About Systems Projects",
    ctaLink: "https://links.growadvantage.com.au/widget/bookings/sanity-call",
  },
];
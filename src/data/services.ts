import { Rocket, Target, Package, MessageCircle, Palette, Sparkles } from "lucide-react";

export interface Service {
  id: string;
  title: string;
  icon: typeof Rocket;
  price: string;
  timeline: string;
  description: string;
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
    id: "fractional-integrator",
    title: "Fractional Integrator & Operations Partnership",
    icon: Rocket,
    price: "Monthly Retainer",
    timeline: "Minimum 12-week engagement",
    description: "The gold-standard retainer for founders ready to scale without chaos.",
    features: [
      "Ongoing day-to-day management",
      "Project delivery & accountability",
      "80% fewer team comms",
      "Strategic leadership & vision alignment",
      "Full operational support team",
      "Weekly touchpoints & reporting",
    ],
    whatYouGet: [
      "Smooth, predictable operations",
      "10+ hours a week back for CEO work",
      "Projects finished on time & budget",
      "Space to finally lead & breathe",
    ],
    cta: "Book a Sanity Call",
    ctaLink: "https://links.growadvantage.com.au/widget/booking/w6yMqL6zSPufCUftc3nU",
    badge: "MOST POPULAR",
  },
  {
    id: "vip-day",
    title: "The Grow Advantage Intensive (VIP Day)",
    icon: Sparkles,
    price: "One-time Investment",
    timeline: "1 Day (90min + Build)",
    description: "Your top operational problem fixed, built, or streamlined in a single day.",
    features: [
      "90-minute live mapping session",
      "Same-day implementation & build",
      "Custom Client Impact Report",
      "1 week of white-glove support",
      "Credit towards retainer (optional)",
    ],
    whatYouGet: [
      "Immediate breathing room",
      "A documented process that sticks",
      "Action plan for what's next",
      "No downtime solution",
    ],
    cta: "Book Your VIP Day",
    ctaLink: "https://cal.com/grow-with-chrissy/grow-advantage-vip-day",
  },
  {
    id: "strategy-session",
    title: "60 Minute Strategy Sessions",
    icon: MessageCircle,
    price: "Single Session",
    timeline: "60 Minutes",
    description: "Targeted strategy to get you unstuck and moving fast with clarity.",
    features: [
      "Deep dive into top priorities",
      "Practical implementation steps",
      "Live Q&A & brainstorming",
      "Resource & tool suggestions",
    ],
    whatYouGet: [
      "Actionable clarity instantly",
      "Direction on stuck systems",
      "Confidence in your focus",
      "Re-energized business outlook",
    ],
    cta: "Book Strategy Session",
    ctaLink: "https://links.growadvantage.com.au/widget/bookings/60-min-strategy-session-chrissy-elle",
  },
  {
    id: "bespoke-projects",
    title: "Bespoke Operations Projects",
    icon: Target,
    price: "Custom Quote",
    timeline: "Project Based",
    description: "For founders who know exactly what’s broken but have zero time to fix it.",
    features: [
      "Onboarding system overhaul",
      "Delivery process streamlining",
      "CRM & tech stack optimization",
      "Internal communications revamp",
      "Expert specialist implementation",
    ],
    whatYouGet: [
      "Seamless client onboarding",
      "Processes that run like clockwork",
      "Systems that actually get used",
      "Reduced bottlenecks & team friction",
    ],
    cta: "Inquire Now",
    ctaLink: "#contact",
  },
];

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
    id: "strategic-launch",
    title: "GA Scale Like A Boss - Strategic Launch",
    icon: Rocket,
    price: "Investment starts at $3,000",
    timeline: "4-6 weeks",
    description: "Strategic launch for new offers, products, or pivots",
    features: [
      "Offer positioning & messaging",
      "Launch strategy & timeline",
      "Sales funnel design",
      "Email sequence creation",
      "Ad creative & targeting plan",
      "Post-launch optimization roadmap",
    ],
    whatYouGet: [
      "Crystal-clear launch strategy",
      "Done-for-you funnel setup",
      "High-converting email sequences",
      "Ad campaign ready to launch",
    ],
    cta: "Get Started",
    ctaLink: "#contact",
    badge: "POPULAR",
  },
  {
    id: "ads-convert",
    title: "GA Scale Like A Boss - Ads that Convert",
    icon: Target,
    price: "Investment starts at $2,500",
    timeline: "Ongoing management",
    description: "High-ROI ad campaigns that actually convert",
    features: [
      "Platform strategy (Meta, Google, TikTok)",
      "Creative testing & optimization",
      "Audience research & targeting",
      "Landing page optimization",
      "Weekly performance reports",
      "Continuous A/B testing",
    ],
    whatYouGet: [
      "Lower cost per acquisition",
      "Better ROAS",
      "Scalable ad systems",
      "Data-driven optimization",
    ],
    cta: "Get Started",
    ctaLink: "#contact",
  },
  {
    id: "starter-kit",
    title: "The Scale Advantage Starter Kit",
    icon: Package,
    price: "Investment: $1,800",
    timeline: "2-3 weeks",
    description: "Foundation for scaling smart",
    features: [
      "Business audit & gap analysis",
      "Tech stack optimization",
      "CRM setup & automation",
      "Basic funnel creation",
      "Email marketing foundation",
      "30-day post-delivery support",
    ],
    whatYouGet: [
      "Clear roadmap to scale",
      "Streamlined systems",
      "Automation that works",
      "Ready to grow infrastructure",
    ],
    cta: "Get Started",
    ctaLink: "#contact",
  },
  {
    id: "strategy-session",
    title: "30-Minute Strategy Session",
    icon: MessageCircle,
    price: "Free for existing clients",
    timeline: "30 minutes",
    description: "Quick strategic consultation",
    features: [
      "Current challenge assessment",
      "Quick-win recommendations",
      "Resource & tool suggestions",
      "Next steps clarity",
    ],
    whatYouGet: [
      "Actionable insights",
      "Clear next steps",
      "Expert guidance",
      "No commitment required",
    ],
    cta: "Book Now",
    ctaLink: "#book",
    priceHighlight: "success",
  },
  {
    id: "wordpress-design",
    title: "Design like WordPress Royalty",
    icon: Palette,
    price: "Investment starts at $4,000",
    timeline: "4-8 weeks",
    description: "Premium WordPress sites that convert",
    features: [
      "Custom design & branding",
      "Mobile-optimized responsive design",
      "SEO foundation setup",
      "Speed optimization",
      "E-commerce ready (if needed)",
      "CMS training included",
      "60-day support",
    ],
    whatYouGet: [
      "Professional, fast-loading site",
      "Conversion-optimized design",
      "Easy to manage backend",
      "Brand-aligned aesthetic",
    ],
    cta: "Get Started",
    ctaLink: "#contact",
  },
  {
    id: "coming-soon",
    title: "More to Come",
    icon: Sparkles,
    price: "Coming Soon",
    timeline: "TBA",
    description: "We're constantly expanding our service offerings",
    features: [
      "New services in development",
      "Custom solutions available",
      "Enterprise packages",
      "VIP day intensives",
    ],
    whatYouGet: [
      "First access to new offers",
      "Custom package options",
      "Priority booking",
    ],
    cta: "Stay Tuned",
    ctaLink: "#",
    disabled: true,
  },
];

import { motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Service } from "@/data/services";

interface ServiceCardProps {
  service: Service;
  index: number;
}

export const ServiceCard = ({ service, index }: ServiceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = service.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative flex flex-col bg-card rounded-xl border-t-4 border-t-primary shadow-card hover:shadow-card-hover transition-all duration-300",
        service.disabled && "opacity-60"
      )}
    >
      {/* Badge */}
      {service.badge && (
        <div className="absolute -top-3 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
          {service.badge}
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Icon */}
        <div className="w-14 h-14 rounded-xl bg-accent-light flex items-center justify-center mb-4">
          <IconComponent className="w-7 h-7 text-primary" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-foreground mb-2 leading-tight">
          {service.title}
        </h3>

        {/* Price */}
        <p
          className={cn(
            "text-lg font-bold mb-1",
            service.priceHighlight === "success"
              ? "text-success"
              : "text-foreground"
          )}
        >
          {service.price}
        </p>

        {/* Timeline */}
        <p className="text-sm text-muted-foreground mb-4">
          Timeline: {service.timeline}
        </p>

        {/* Description */}
        <p className="text-muted-foreground mb-6">{service.description}</p>

        {/* Features */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
            What's Included
          </h4>
          <ul className="space-y-2">
            {service.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What You Get - Collapsible on mobile */}
        <div className="mb-6">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3 uppercase tracking-wide md:pointer-events-none"
          >
            What You Get
            <ChevronDown
              className={cn(
                "w-4 h-4 md:hidden transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </button>
          <motion.ul
            initial={false}
            animate={{
              height: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0,
            }}
            className={cn(
              "space-y-2 overflow-hidden md:!h-auto md:!opacity-100"
            )}
          >
            {service.whatYouGet.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* CTA Button */}
        <div className="mt-auto">
          <Button
            asChild={!service.disabled}
            disabled={service.disabled}
            className="w-full"
            size="lg"
          >
            {service.disabled ? (
              <span>{service.cta}</span>
            ) : (
              <a href={service.ctaLink}>{service.cta}</a>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

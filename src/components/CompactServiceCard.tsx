import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Service } from "@/data/services";

interface CompactServiceCardProps {
  service: Service;
  index: number;
  onLearnMore: () => void;
}

export const CompactServiceCard = ({ service, index, onLearnMore }: CompactServiceCardProps) => {
  const IconComponent = service.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative flex flex-col bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer",
        service.disabled && "opacity-60 cursor-not-allowed"
      )}
      onClick={!service.disabled ? onLearnMore : undefined}
    >
      {/* Badge */}
      {service.badge && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">
          {service.badge}
        </div>
      )}

      <div className="p-5 flex flex-col h-full">
        {/* Icon */}
        <div className="w-12 h-12 rounded-lg bg-accent-light flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <IconComponent className="w-6 h-6 text-primary" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-foreground mb-2 leading-tight line-clamp-2">
          {service.title}
        </h3>

        {/* Price */}
        <p
          className={cn(
            "text-base font-bold mb-3",
            service.priceHighlight === "success"
              ? "text-success"
              : "text-foreground"
          )}
        >
          {service.price}
        </p>

        {/* Short Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
          {service.shortDescription || service.description}
        </p>

        {/* Timeline */}
        <p className="text-xs text-muted-foreground mb-4">
          Timeline: {service.timeline}
        </p>

        {/* CTA Button */}
        <Button
          variant="ghost"
          className="w-full justify-between group-hover:bg-accent"
          size="sm"
          disabled={service.disabled}
        >
          <span className="text-sm font-medium">Learn More</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </motion.div>
  );
};

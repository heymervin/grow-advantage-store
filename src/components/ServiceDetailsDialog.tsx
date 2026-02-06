import { Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Service } from "@/data/services";

interface ServiceDetailsDialogProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServiceDetailsDialog = ({
  service,
  open,
  onOpenChange,
}: ServiceDetailsDialogProps) => {
  if (!service) return null;

  const IconComponent = service.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            {/* Header with Icon and Title */}
            <DialogHeader className="mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
                  <IconComponent className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold mb-2">
                    {service.title}
                  </DialogTitle>
                  {service.badge && (
                    <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                      {service.badge}
                    </span>
                  )}
                </div>
              </div>

              {/* Price and Timeline */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                <p
                  className={cn(
                    "text-xl font-bold",
                    service.priceHighlight === "success"
                      ? "text-success"
                      : "text-foreground"
                  )}
                >
                  {service.price}
                </p>
                <p className="text-sm text-muted-foreground">
                  Timeline: {service.timeline}
                </p>
              </div>

              <DialogDescription className="text-base text-foreground">
                {service.description}
              </DialogDescription>
            </DialogHeader>

            {/* What's Included */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                What's Included
              </h4>
              <ul className="space-y-2">
                {service.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What You Get */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                What You Get
              </h4>
              <ul className="space-y-2">
                {service.whatYouGet.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-muted-foreground"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <Button
              asChild={!service.disabled}
              disabled={service.disabled}
              className="w-full"
              size="lg"
            >
              {service.disabled ? (
                <span>{service.cta}</span>
              ) : (
                <a href={service.ctaLink} target="_blank" rel="noopener noreferrer">
                  {service.cta}
                </a>
              )}
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
import { useState } from "react";
import { services } from "@/data/services";
import { CompactServiceCard } from "./CompactServiceCard";
import { ServiceDetailsDialog } from "./ServiceDetailsDialog";
import type { Service } from "@/data/services";

export const CompactServicesGrid = () => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleLearnMore = (service: Service) => {
    setSelectedService(service);
    setDialogOpen(true);
  };

  return (
    <>
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {services.map((service, index) => (
              <CompactServiceCard
                key={service.id}
                service={service}
                index={index}
                onLearnMore={() => handleLearnMore(service)}
              />
            ))}
          </div>
        </div>
      </section>

      <ServiceDetailsDialog
        service={selectedService}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};

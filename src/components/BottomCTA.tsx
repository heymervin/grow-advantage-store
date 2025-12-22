import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export const BottomCTA = () => {
  return (
    <section className="py-16 md:py-24 bg-foreground">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-background mb-4">
            Not sure which service fits?
          </h2>
          <h3 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            Let's talk.
          </h3>
          <p className="text-lg text-background/70 mb-8">
            Book a free strategy call and we'll help you figure out the best path forward.
          </p>
          <Button
            asChild
            size="lg"
            className="text-lg px-8 py-6 h-auto"
          >
            <a href="#schedule" className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule Free Call
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

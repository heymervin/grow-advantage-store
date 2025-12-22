import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export const Testimonial = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-accent-light rounded-2xl p-8 md:p-12 max-w-4xl mx-auto"
        >
          <div className="flex flex-col items-center text-center">
            <Quote className="w-12 h-12 text-primary/30 mb-6" />
            
            <blockquote className="text-xl md:text-2xl font-medium text-foreground mb-8 leading-relaxed">
              "Grow Advantage transformed our launch. We hit 6 figures in 90 days."
            </blockquote>
            
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">JM</span>
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Jessica Martinez</p>
                <p className="text-sm text-muted-foreground">Founder, Bloom Digital</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

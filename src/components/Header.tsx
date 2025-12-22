import { motion } from "framer-motion";

export const Header = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-3">
            Add-On Services
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Your big ideas deserve serious ops. We've got you.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

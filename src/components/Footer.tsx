export const Footer = () => {
  return (
    <footer className="py-8 bg-background border-t border-border">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground">
          All investments are project-based. Payment plans available. Questions?{" "}
          <a
            href="#contact"
            className="text-primary hover:underline font-medium"
          >
            Contact us anytime
          </a>
          .
        </p>
      </div>
    </footer>
  );
};

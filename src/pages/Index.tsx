import { Header } from "@/components/Header";
import { ServicesGrid } from "@/components/ServicesGrid";
import { Testimonial } from "@/components/Testimonial";
import { BottomCTA } from "@/components/BottomCTA";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ServicesGrid />
      <Testimonial />
      <BottomCTA />
      <Footer />
    </div>
  );
};

export default Index;

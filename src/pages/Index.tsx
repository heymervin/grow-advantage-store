import { Header } from "@/components/Header";
import { ServicesGrid } from "@/components/ServicesGrid";
import { Testimonial } from "@/components/Testimonial";
import { BottomCTA } from "@/components/BottomCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ServicesGrid />
      <Testimonial />
      <BottomCTA />
    </div>
  );
};

export default Index;

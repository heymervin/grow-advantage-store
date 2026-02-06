import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Check, Star, Settings, HeartHandshake,
  MessageCircle, UserPlus, Wrench, Package, Zap, BookOpen,
  Rocket, Target, Award, Gift, Briefcase, Globe, Heart,
  Lightbulb, Mail, Phone, Shield, TrendingUp, Video, Headphones, Layers,
  BarChart3, Clock, DollarSign, FileText, Megaphone, Palette, PenTool,
  Send, Sparkles, ThumbsUp, Wand2, Monitor, Smartphone, Database,
  CloudLightning, Gem, Crown, Flame, Compass, Puzzle, RefreshCw,
  Users, Calendar, ShoppingBag, X,
  type LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import type { Addon } from "@/types/database";
import { cn } from "@/lib/utils";

// Map icon names from DB to actual Lucide components
const iconMap: Record<string, LucideIcon> = {
  Star, Settings, HeartHandshake, MessageCircle, UserPlus, Wrench,
  Package, Zap, BookOpen, Rocket, Target, Award, Gift, Briefcase,
  Globe, Heart, Lightbulb, Mail, Phone, Shield, TrendingUp, Video,
  Headphones, Layers, BarChart3, Clock, DollarSign, FileText, Megaphone,
  Palette, PenTool, Send, Sparkles, ThumbsUp, Wand2, Monitor, Smartphone,
  Database, CloudLightning, Gem, Crown, Flame, Compass, Puzzle, RefreshCw,
  Users, Calendar, ShoppingBag,
};

const Addons = () => {
  const [searchParams] = useSearchParams();
  const clientSlug = searchParams.get("client") || "";
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("addons")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setAddons(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const handleLearnMore = (addon: Addon) => {
    setSelectedAddon(addon);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {clientSlug && (
            <Link
              to={`/dashboard?client=${clientSlug}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          )}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-3">
              Add-ons & Upgrades
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Your big ideas deserve serious ops. We've got you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-card rounded-xl border border-border p-5 space-y-3">
                  <div className="w-12 h-12 rounded-lg bg-muted" />
                  <div className="h-5 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="h-12 rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : addons.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No add-ons available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
              {addons.map((addon, index) => {
                const IconComponent = iconMap[addon.icon_name] || Package;
                return (
                  <motion.div
                    key={addon.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="relative flex flex-col bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer"
                    onClick={() => handleLearnMore(addon)}
                  >
                    {addon.badge && (
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">
                        {addon.badge}
                      </div>
                    )}
                    <div className="p-5 flex flex-col h-full">
                      <div className="w-12 h-12 rounded-lg bg-accent-light flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2 leading-tight line-clamp-2">
                        {addon.title}
                      </h3>
                      <p className={cn("text-base font-bold mb-3", "text-foreground")}>
                        {addon.price}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                        {addon.short_description || addon.description}
                      </p>
                      {addon.timeline && (
                        <p className="text-xs text-muted-foreground mb-4">
                          Timeline: {addon.timeline}
                        </p>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full justify-between group-hover:bg-accent"
                        size="sm"
                      >
                        <span className="text-sm font-medium">Learn More</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Detail Dialog */}
      {selectedAddon && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] p-0">
            <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
            <ScrollArea className="max-h-[90vh]">
              <div className="p-6">
                <DialogHeader className="mb-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
                      {(() => {
                        const Icon = iconMap[selectedAddon.icon_name] || Package;
                        return <Icon className="w-8 h-8 text-primary" />;
                      })()}
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-2xl font-bold mb-2">{selectedAddon.title}</DialogTitle>
                      {selectedAddon.badge && (
                        <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                          {selectedAddon.badge}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                    <p className="text-xl font-bold text-foreground">{selectedAddon.price}</p>
                    {selectedAddon.timeline && (
                      <p className="text-sm text-muted-foreground">Timeline: {selectedAddon.timeline}</p>
                    )}
                  </div>
                  <DialogDescription className="text-base text-foreground">
                    {selectedAddon.description}
                  </DialogDescription>
                </DialogHeader>

                {selectedAddon.features && selectedAddon.features.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">What's Included</h4>
                    <ul className="space-y-2">
                      {selectedAddon.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedAddon.what_you_get && selectedAddon.what_you_get.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">What You Get</h4>
                    <ul className="space-y-2">
                      {selectedAddon.what_you_get.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button asChild className="w-full" size="lg">
                  <a href={selectedAddon.cta_link} target="_blank" rel="noopener noreferrer">
                    {selectedAddon.cta_text}
                  </a>
                </Button>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Addons;

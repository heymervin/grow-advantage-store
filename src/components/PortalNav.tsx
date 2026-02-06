import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Home, LayoutDashboard, FileText, ShoppingBag, Settings } from "lucide-react";

interface Breadcrumb {
  label: string;
  href?: string;
}

const PortalNav = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const clientSlug = searchParams.get("client") || "";
  const path = location.pathname;

  // Build breadcrumbs based on current route
  const breadcrumbs: Breadcrumb[] = [{ label: "Home", href: "/" }];

  if (path === "/dashboard") {
    breadcrumbs.push({ label: "Dashboard" });
  } else if (path === "/snapshot") {
    breadcrumbs.push({ label: "Dashboard", href: `/dashboard?client=${clientSlug}` });
    const month = searchParams.get("month") || "";
    breadcrumbs.push({ label: `Snapshot${month ? ` \u2014 ${month.replace("-", " ").replace(/\\b\\w/g, (c) => c.toUpperCase())}` : ""}` });
  } else if (path === "/addons") {
    if (clientSlug) {
      breadcrumbs.push({ label: "Dashboard", href: `/dashboard?client=${clientSlug}` });
    }
    breadcrumbs.push({ label: "Add-ons & Upgrades" });
  } else if (path === "/admin") {
    breadcrumbs.push({ label: "Admin" });
  }

  const navLinks = [
    ...(clientSlug
      ? [
          { label: "Dashboard", href: `/dashboard?client=${clientSlug}`, icon: LayoutDashboard, match: "/dashboard" },
          { label: "Add-ons", href: `/addons?client=${clientSlug}`, icon: ShoppingBag, match: "/addons" },
        ]
      : []),
    { label: "Admin", href: "/admin", icon: Settings, match: "/admin" },
  ];

  // Don't show nav on the index/home page
  if (path === "/") return null;

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Left: Logo + Breadcrumbs */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-extrabold">GA</span>
              </div>
            </Link>
            <div className="flex items-center gap-1.5 text-sm min-w-0 overflow-hidden">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5 shrink-0">
                  {i > 0 && <span className="text-border">/</span>}
                  {crumb.href ? (
                    <Link to={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors truncate">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-foreground truncate">{crumb.label}</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Nav Links */}
          <div className="flex items-center gap-1 shrink-0">
            {navLinks.map((link) => {
              const isActive = path === link.match;
              const Icon = link.icon;
              return (
                <Link
                  key={link.match}
                  to={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PortalNav;

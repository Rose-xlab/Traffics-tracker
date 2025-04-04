// app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  Globe, 
  FileText, 
  Bell, 
  Settings, 
  Database, 
  BarChart,
  RefreshCcw,
  Users,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if user is admin
  const isAdmin = user?.app_metadata?.is_admin || false;

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      router.push("/auth/login?redirect=/admin");
    } else if (!loading && !isAdmin) {
      // Redirect to home if not an admin
      router.push("/");
    }
  }, [loading, user, isAdmin, router]);

  const isActive = (path: string) => {
    return pathname === `/admin${path}`;
  };

  // Navigation items
  const navItems = [
    { href: "", label: "Dashboard", icon: LayoutDashboard },
    { href: "/products", label: "Products", icon: Package },
    { href: "/countries", label: "Countries", icon: Globe },
    { href: "/updates", label: "Trade Updates", icon: FileText },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/users", label: "Users", icon: Users },
    { href: "/sync", label: "Data Sync", icon: RefreshCcw },
    { href: "/analytics", label: "Analytics", icon: BarChart },
    { href: "/database", label: "Database", icon: Database },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  // Show loading state
  if (loading || (!user && !loading) || (!isAdmin && !loading)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar navigation */}
      <aside 
        className={`${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-200 fixed md:sticky top-0 z-40 h-screen w-64 border-r bg-background/80 backdrop-blur-sm md:flex flex-col`}
      >
        <div className="p-6">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Tariffs Tracker</p>
        </div>
        <Separator />
        <nav className="flex-1 overflow-auto p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={`/admin${item.href}`}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
            >
              <Link href="/">Exit Admin</Link>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
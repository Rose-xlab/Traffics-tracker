"use client";

import { Search, Globe2, TrendingUp, Bell, Shield, BookOpen } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { productService } from "@/lib/services/product-service";
import type { Product } from "@/types";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const debouncedSearch = useDebounce(searchQuery, 300);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const results = await productService.searchProducts({
        query: searchQuery,
      });
      
      // Redirect to search page with results
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Understand U.S. Import Tariffs
            <span className="text-primary block mt-2">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Your trusted platform for navigating complex U.S. import tariffs. Get real-time rates, 
            track changes, and make informed decisions.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for products (e.g., running shoes, laptop, wooden furniture)"
                  className="pl-10 h-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="lg" className="px-8" type="submit" disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Know About Tariffs
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Globe2 className="h-8 w-8" />}
              title="Global Coverage"
              description="Access tariff information for imports from any country to the United States"
            />
            <FeatureCard
              icon={<TrendingUp className="h-8 w-8" />}
              title="Real-time Updates"
              description="Stay informed with the latest changes in tariff rates and policies"
            />
            <FeatureCard
              icon={<Bell className="h-8 w-8" />}
              title="Custom Alerts"
              description="Set up notifications for specific products or countries you care about"
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Reliable Data"
              description="Information sourced directly from official government databases"
            />
            <FeatureCard
              icon={<Search className="h-8 w-8" />}
              title="Simple Search"
              description="Find tariff information using everyday product names, no HTS codes needed"
            />
            <FeatureCard
              icon={<BookOpen className="h-8 w-8" />}
              title="Educational Resources"
              description="Learn about trade policies and their impact on imports"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
}
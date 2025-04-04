"use client";

import { Card } from "@/components/ui/card";
import {
  Info,
  Globe,
  Search,
  TrendingUp,
  Bell,
  Shield,
  BookOpen,
} from "lucide-react";

export default function AboutPage() {
  const features = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Simple Product Search",
      description:
        "Search using everyday product names instead of complex HTS codes. Our system maps common terms to the correct tariff categories.",
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Global Coverage",
      description:
        "Access tariff information for imports from any country to the United States, including special trade agreements and additional duties.",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Historical Analysis",
      description:
        "Track how tariffs have changed over time and understand trends in international trade policies.",
    },
    {
      icon: <Bell className="h-6 w-6" />,
      title: "Updates & Notifications",
      description:
        "Stay informed about changes in tariff rates, new trade policies, and important announcements.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Reliable Data",
      description:
        "All information is sourced directly from official government databases and updated regularly.",
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Educational Resources",
      description:
        "Access guides, tutorials, and explanations to better understand trade policies and their impacts.",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-2">
          <Info className="h-8 w-8" />
          About TariffsTracker
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          TariffsTracker simplifies the complex world of U.S. import tariffs,
          making trade information accessible and understandable for everyone.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature, index) => (
          <Card key={index} className="p-6">
            <div className="text-primary mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground mb-4">
            We aim to democratize access to trade information by translating complex
            government data into actionable insights for businesses, researchers,
            and the general public.
          </p>
          <p className="text-muted-foreground">
            By making tariff information more accessible and understandable, we
            help users make informed decisions about international trade and
            understand the impact of trade policies.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Data Sources</h2>
          <p className="text-muted-foreground mb-4">
            Our platform aggregates data from authoritative sources including:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li>• U.S. International Trade Commission (USITC)</li>
            <li>• U.S. Trade Representative (USTR)</li>
            <li>• U.S. Customs and Border Protection (CBP)</li>
            <li>• Department of Commerce</li>
            <li>• Federal Register</li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
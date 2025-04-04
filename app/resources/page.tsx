"use client";

import { Card } from "@/components/ui/card";
import { BookOpen, FileText, Video, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export default function ResourcesPage() {
  const resources = [
    {
      title: "Understanding HTS Codes",
      type: "Guide",
      description: "Learn how to read and interpret Harmonized Tariff Schedule codes.",
      icon: FileText,
    },
    {
      title: "Tariff Calculation Basics",
      type: "Video",
      description: "Step-by-step guide to calculating import duties and fees.",
      icon: Video,
    },
    // Add more resources
  ];

  const links = [
    {
      title: "U.S. International Trade Commission",
      url: "https://www.usitc.gov/",
      description: "Official source for U.S. tariff information.",
    },
    // Add more links
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          Educational Resources
        </h1>
        <p className="text-muted-foreground">
          Learn about tariffs, trade policies, and how they affect imports.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {resources.map((resource, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <resource.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">{resource.title}</h2>
                <p className="text-muted-foreground mb-4">{resource.description}</p>
                <span className="text-sm bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                  {resource.type}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <LinkIcon className="h-6 w-6" />
        Useful Links
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {links.map((link, index) => (
          <Card key={index} className="p-6">
            <h3 className="text-lg font-semibold mb-2">
              <Link href={link.url} target="_blank" className="hover:text-primary">
                {link.title}
              </Link>
            </h3>
            <p className="text-muted-foreground">{link.description}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
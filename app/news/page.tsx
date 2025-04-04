"use client";

import { Card } from "@/components/ui/card";
import { Newspaper, Calendar } from "lucide-react";

export default function NewsPage() {
  // Mock data - replace with real data from API
  const news = [
    {
      id: 1,
      title: "New Section 301 Tariffs Announced",
      date: "2025-04-01",
      summary: "The USTR has announced new tariffs affecting various products...",
      category: "Policy Update",
      source: "U.S. Trade Representative",
    },
    // Add more news items
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <Newspaper className="h-8 w-8" />
          Latest Tariff News & Updates
        </h1>
      </div>

      <div className="space-y-6">
        {news.map((item) => (
          <Card key={item.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-semibold">{item.title}</h2>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {item.date}
              </span>
            </div>
            <p className="text-muted-foreground mb-4">{item.summary}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
                {item.category}
              </span>
              <span className="text-sm text-muted-foreground">{item.source}</span>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from "lucide-react";
import type { SearchFilters } from "@/types/api";

interface SearchFiltersProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

export function SearchFilters({ filters, onFilterChange }: SearchFiltersProps) {
  const categories = [
    "Electronics",
    "Textiles",
    "Machinery",
    "Chemicals",
    "Metals",
    "Food",
  ];

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Filter className="h-5 w-5" />
        Filters
      </h2>

      <div className="space-y-6">
        <div className="space-y-4">
          <Label>Categories</Label>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={category}
                  checked={filters.category === category}
                  onCheckedChange={() =>
                    onFilterChange({
                      ...filters,
                      category: filters.category === category ? undefined : category,
                    })
                  }
                />
                <Label htmlFor={category} className="text-sm font-normal">
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label>Tariff Rate Range</Label>
          <Slider
            defaultValue={[0, 100]}
            max={100}
            step={1}
            value={[
              filters.rateRange?.min || 0,
              filters.rateRange?.max || 100,
            ]}
            onValueChange={([min, max]) =>
              onFilterChange({
                ...filters,
                rateRange: { min, max },
              })
            }
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{filters.rateRange?.min || 0}%</span>
            <span>{filters.rateRange?.max || 100}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
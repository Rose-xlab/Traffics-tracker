"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Globe } from "lucide-react";
import { CountryCard } from "@/components/data/country-card";
import { countryService } from "@/lib/services/country-service";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";

export default function CountriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { toast } = useToast();

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const data = await countryService.getCountries();
      setCountries(data);
    } catch (error) {
      console.error('Error loading countries:', error);
      toast({
        title: "Error",
        description: "Failed to load countries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    country.code.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Countries & Trade Agreements
          </h1>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-[300px] animate-pulse" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <Globe className="h-8 w-8" />
          Countries & Trade Agreements
        </h1>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search countries..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCountries.map((country) => (
          <CountryCard
            key={country.id}
            id={country.id}
            name={country.name}
            flagUrl={country.flag_url}
            description={country.description}
            agreements={country.trade_agreements}
            specialTariffs={country.special_tariffs}
          />
        ))}
      </div>

      {filteredCountries.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No countries found matching your search</p>
        </Card>
      )}
    </main>
  );
}
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CountryCardProps {
  id: string;
  name: string;
  flagUrl: string;
  description: string;
  agreements: string[];
  specialTariffs: string[];
}

export function CountryCard({
  id,
  name,
  flagUrl,
  description,
  agreements,
  specialTariffs,
}: CountryCardProps) {
  return (
    <Card className="overflow-hidden">
      <div
        className="h-40 bg-cover bg-center"
        style={{ backgroundImage: `url(${flagUrl})` }}
      />
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2">{name}</h2>
        <p className="text-muted-foreground mb-4">{description}</p>
        <div className="space-y-2">
          <div>
            <h3 className="text-sm font-medium">Trade Agreements</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {agreements.map((agreement) => (
                <span
                  key={agreement}
                  className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                >
                  {agreement}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium">Special Tariffs</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              {specialTariffs.map((tariff) => (
                <span
                  key={tariff}
                  className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full"
                >
                  {tariff}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Link
            href={`/countries/${id}`}
            className="text-primary hover:text-primary/80 font-medium flex items-center gap-2"
          >
            View Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}
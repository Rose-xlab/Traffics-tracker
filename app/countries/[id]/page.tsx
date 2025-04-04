"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Globe,
  TrendingUp,
  FileText,
  AlertCircle,
  Package,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { countryService } from "@/lib/services/country-service";
import { useToast } from "@/hooks/use-toast";

export default function CountryPage() {
  const params = useParams();
  const [country, setCountry] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCountryData();
  }, [params.id]);

  const loadCountryData = async () => {
    try {
      setLoading(true);
      const [countryData, statsData] = await Promise.all([
        countryService.getCountry(params.id as string),
        countryService.getCountryStatistics(params.id as string)
      ]);
      setCountry(countryData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error loading country data:', error);
      toast({
        title: "Error",
        description: "Failed to load country data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6">Loading country details...</Card>
      </main>
    );
  }

  if (!country) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Country Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The country you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/countries">Back to Countries</Link>
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Country Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <Globe className="h-8 w-8" />
              {country.name}
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              {country.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {country.trade_agreements.map((agreement) => (
                <span
                  key={agreement}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  {agreement}
                </span>
              ))}
              {country.special_tariffs.map((tariff) => (
                <span
                  key={tariff}
                  className="bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm"
                >
                  {tariff}
                </span>
              ))}
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/countries" className="flex items-center gap-2">
              Back to Countries
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[2fr,1fr] gap-8">
        <div className="space-y-6">
          {/* Trade Statistics */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Trade Statistics
            </h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statistics.monthlyTrade}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    name="Imports (B USD)"
                    dataKey="imports"
                    fill="hsl(var(--primary))"
                  />
                  <Bar
                    name="Exports (B USD)"
                    dataKey="exports"
                    fill="hsl(var(--destructive))"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top Products */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="h-6 w-6" />
              Top Products
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Trade Volume</TableHead>
                  <TableHead>Average Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(statistics.categoryBreakdown).map(([category, data]) => (
                  <TableRow key={category}>
                    <TableCell className="font-medium">{category}</TableCell>
                    <TableCell>{data.volume.toFixed(1)}B</TableCell>
                    <TableCell>{(data.rate / data.count).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Statistics</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Annual Trade Volume</p>
                <p className="text-2xl font-bold">
                  {statistics.monthlyTrade.reduce((sum, month) => 
                    sum + month.imports + month.exports, 0
                  ).toFixed(1)}B USD
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Data shown is for reference only. Official trade statistics may vary.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Documentation */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Related Documents
            </h2>
            <div className="space-y-2">
              {country.trade_agreements.map((agreement) => (
                <Button
                  key={agreement}
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="#">
                    <FileText className="h-4 w-4 mr-2" />
                    {agreement} Details
                  </Link>
                </Button>
              ))}
              {country.special_tariffs.map((tariff) => (
                <Button
                  key={tariff}
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="#">
                    <FileText className="h-4 w-4 mr-2" />
                    {tariff} Notice
                  </Link>
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
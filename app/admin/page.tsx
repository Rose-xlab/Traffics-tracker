// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Database, Package, Globe, BarChart, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { ApiClient } from "@/lib/utils/api-client";

interface DashboardStats {
  productsCount: number;
  countriesCount: number;
  updatesCount: number;
  syncStatus: {
    lastRun: string;
    status: string;
  };
  recentActivity: {
    action: string;
    time: string;
    user: string;
  }[];
  systemHealth: {
    database: "healthy" | "degraded" | "down";
    api: "healthy" | "degraded" | "down";
    sync: "healthy" | "degraded" | "down";
  };
  popularSearches: {
    term: string;
    count: number;
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sample activity data for chart
  const activityData = [
    { date: "04/01", users: 20, searches: 145, pageViews: 420 },
    { date: "04/02", users: 25, searches: 160, pageViews: 450 },
    { date: "04/03", users: 22, searches: 152, pageViews: 430 },
    { date: "04/04", users: 28, searches: 175, pageViews: 470 },
    { date: "04/05", users: 30, searches: 190, pageViews: 490 },
    { date: "04/06", users: 35, searches: 205, pageViews: 520 },
    { date: "04/07", users: 32, searches: 195, pageViews: 500 },
  ];

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true);
        // In a real implementation, this would be an API call
        // const data = await ApiClient.get<DashboardStats>('/api/admin/dashboard');
        
        // Using mock data for now
        const mockData: DashboardStats = {
          productsCount: 1243,
          countriesCount: 87,
          updatesCount: 32,
          syncStatus: {
            lastRun: new Date().toISOString(),
            status: "completed"
          },
          recentActivity: [
            { action: "Product updated", time: "10 minutes ago", user: "admin@example.com" },
            { action: "New user registered", time: "2 hours ago", user: "user@example.com" },
            { action: "Sync job started", time: "3 hours ago", user: "system" },
            { action: "Country added", time: "1 day ago", user: "admin@example.com" },
          ],
          systemHealth: {
            database: "healthy",
            api: "healthy",
            sync: "healthy"
          },
          popularSearches: [
            { term: "electronic components", count: 245 },
            { term: "footwear", count: 187 },
            { term: "auto parts", count: 156 },
            { term: "textiles", count: 132 },
            { term: "steel", count: 117 },
          ]
        };
        
        setStats(mockData);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-4 w-full mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
        <CardTitle className="mb-2">Failed to load dashboard</CardTitle>
        <CardDescription>{error}</CardDescription>
        <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the Tariffs Tracker admin dashboard.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/admin/products" className="hover:underline">View all products</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.countriesCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/admin/countries" className="hover:underline">Manage countries</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trade Updates</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.updatesCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/admin/updates" className="hover:underline">View updates</Link>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Healthy</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/admin/settings" className="hover:underline">View system status</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="week">
              <TabsList className="mb-4">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
              <TabsContent value="day" className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData.slice(-1)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" />
                    <Line type="monotone" dataKey="searches" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="pageViews" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="week" className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" />
                    <Line type="monotone" dataKey="searches" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="pageViews" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="month" className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityData.map(d => ({...d, users: d.users * 4, searches: d.searches * 4, pageViews: d.pageViews * 4}))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" />
                    <Line type="monotone" dataKey="searches" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="pageViews" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="rounded-full p-1 bg-muted">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <div className="flex text-xs text-muted-foreground gap-2">
                      <span>{activity.time}</span>
                      <span>•</span>
                      <span>{activity.user}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/admin/activity">View All Activity</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Popular Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.popularSearches.map((search, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{i + 1}.</div>
                    <div className="text-sm">{search.term}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{search.count} searches</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Database</div>
                <div className={`text-sm ${stats.systemHealth.database === 'healthy' ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.systemHealth.database.charAt(0).toUpperCase() + stats.systemHealth.database.slice(1)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">API Service</div>
                <div className={`text-sm ${stats.systemHealth.api === 'healthy' ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.systemHealth.api.charAt(0).toUpperCase() + stats.systemHealth.api.slice(1)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Sync Service</div>
                <div className={`text-sm ${stats.systemHealth.sync === 'healthy' ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.systemHealth.sync.charAt(0).toUpperCase() + stats.systemHealth.sync.slice(1)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Last Sync</div>
                <div className="text-sm">
                  {new Date(stats.syncStatus.lastRun).toLocaleString()}
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/admin/sync">Run Manual Sync</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
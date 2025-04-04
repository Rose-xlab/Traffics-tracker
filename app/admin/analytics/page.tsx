// app/admin/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, DownloadIcon, Calendar, ArrowUpRight, ArrowDownRight, Filter, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiClient } from "@/lib/utils/api-client";
import type { EventType, EventData } from "@/types/analytics";

// Types for analytics data
interface SearchTrend {
  term: string;
  frequency: number;
  last_searched: string;
}

interface EventCount {
  type: EventType;
  count: number;
  change: number;
}

interface TimeSeriesData {
  date: string;
  searches: number;
  product_views: number;
  calculate_duty: number;
  watchlist_changes: number;
}

interface UserActivity {
  userId: string;
  events: number;
  lastActive: string;
}

interface EventBreakdown {
  name: string;
  value: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7days");
  const [eventTotals, setEventTotals] = useState<EventCount[]>([]);
  const [searchTrends, setSearchTrends] = useState<SearchTrend[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [eventBreakdown, setEventBreakdown] = useState<EventBreakdown[]>([]);
  const { toast } = useToast();

  // Color constants for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, we would fetch these from the API
      // const eventsData = await ApiClient.get(`/api/admin/analytics/events?timeRange=${timeRange}`);
      // const trendsData = await ApiClient.get(`/api/admin/analytics/search-trends?timeRange=${timeRange}`);
      // const timeSeriesData = await ApiClient.get(`/api/admin/analytics/time-series?timeRange=${timeRange}`);
      // const usersData = await ApiClient.get(`/api/admin/analytics/users?timeRange=${timeRange}`);
      
      // Mock data for demonstration
      const mockEventTotals: EventCount[] = [
        { type: 'search', count: 1254, change: 5.2 },
        { type: 'view_product', count: 3782, change: -2.1 },
        { type: 'calculate_duty', count: 876, change: 12.5 },
        { type: 'add_to_watchlist', count: 432, change: 8.3 },
        { type: 'error', count: 98, change: -15.2 }
      ];
      
      const mockSearchTrends: SearchTrend[] = [
        { term: "electronic components", frequency: 245, last_searched: "2025-04-02T15:32:00Z" },
        { term: "solar panels", frequency: 212, last_searched: "2025-04-03T09:15:00Z" },
        { term: "textiles china", frequency: 187, last_searched: "2025-04-01T11:22:00Z" },
        { term: "automotive parts", frequency: 156, last_searched: "2025-04-03T14:05:00Z" },
        { term: "metals steel", frequency: 132, last_searched: "2025-04-02T10:45:00Z" },
        { term: "aluminum", frequency: 117, last_searched: "2025-04-03T16:30:00Z" },
        { term: "cotton fabric", frequency: 105, last_searched: "2025-04-01T08:12:00Z" },
        { term: "plastic components", frequency: 94, last_searched: "2025-04-02T13:50:00Z" },
        { term: "furniture", frequency: 87, last_searched: "2025-04-03T12:10:00Z" },
        { term: "pharmaceuticals", frequency: 76, last_searched: "2025-04-01T09:40:00Z" }
      ];
      
      // Generate time series data
      const mockTimeSeriesData: TimeSeriesData[] = [];
      const days = timeRange === "30days" ? 30 : timeRange === "14days" ? 14 : 7;
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        mockTimeSeriesData.push({
          date: date.toISOString().split('T')[0],
          searches: Math.floor(Math.random() * 100) + 20,
          product_views: Math.floor(Math.random() * 300) + 50,
          calculate_duty: Math.floor(Math.random() * 50) + 10,
          watchlist_changes: Math.floor(Math.random() * 30) + 5
        });
      }
      
      // Mock user activity
      const mockUserActivity: UserActivity[] = Array.from({ length: 5 }).map((_, i) => ({
        userId: `user${i + 1}@example.com`,
        events: Math.floor(Math.random() * 100) + 10,
        lastActive: new Date(today.getTime() - Math.floor(Math.random() * 86400000)).toISOString()
      }));
      
      // Mock event breakdown
      const mockEventBreakdown: EventBreakdown[] = [
        { name: 'Search', value: 30 },
        { name: 'View Product', value: 45 },
        { name: 'Calculate Duty', value: 10 },
        { name: 'Add to Watchlist', value: 8 },
        { name: 'Remove from Watchlist', value: 5 },
        { name: 'Error', value: 2 },
      ];
      
      // Set data to state
      setEventTotals(mockEventTotals);
      setSearchTrends(mockSearchTrends);
      setTimeSeriesData(mockTimeSeriesData);
      setUserActivity(mockUserActivity);
      setEventBreakdown(mockEventBreakdown);
      
    } catch (error) {
      console.error("Error loading analytics data:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle date range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Refresh analytics data
  const refreshData = () => {
    loadAnalyticsData();
    toast({
      title: "Refreshed",
      description: "Analytics data has been refreshed",
    });
  };

  // Export analytics data
  const exportAnalytics = () => {
    // In a real implementation, this would generate a CSV or Excel file
    toast({
      title: "Export Started",
      description: "Analytics export has been initiated",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Analysis of user activity and system performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select
              value={timeRange}
              onValueChange={handleTimeRangeChange}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="14days">Last 14 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={refreshData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={exportAnalytics}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Event Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {eventTotals.slice(0, 4).map((event) => (
          <Card key={event.type}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {event.type === 'search' ? 'Searches' :
                 event.type === 'view_product' ? 'Product Views' :
                 event.type === 'calculate_duty' ? 'Duty Calculations' :
                 event.type === 'add_to_watchlist' ? 'Watchlist Additions' :
                 event.type === 'error' ? 'Errors' : 
                 event.type.replace(/_/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{event.count.toLocaleString()}</div>
              <div className="flex items-center mt-1">
                {event.change > 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                )}
                <p className={`text-xs ${event.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.abs(event.change)}% from previous period
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4" />
            Search Analysis
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            User Activity
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Activity Over Time</CardTitle>
              <CardDescription>User interactions over the selected time period</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="searches" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="product_views" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="calculate_duty" stroke="#ffc658" />
                  <Line type="monotone" dataKey="watchlist_changes" stroke="#ff8042" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Event Breakdown</CardTitle>
                <CardDescription>Distribution of event types</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={eventBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {eventBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Search Terms</CardTitle>
                <CardDescription>Most frequent search queries</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={searchTrends.slice(0, 5)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="term" width={150} />
                    <Tooltip />
                    <Bar dataKey="frequency" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Search Analysis Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Trends</CardTitle>
              <CardDescription>Most popular search terms and their frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Term</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Frequency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Searched</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {searchTrends.map((term, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-background' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{term.term}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{term.frequency}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(term.last_searched)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Search Volume by Day</CardTitle>
                <CardDescription>Daily search activity</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={timeSeriesData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="searches" fill="#8884d8" name="Searches" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Search-to-View Conversion</CardTitle>
                <CardDescription>Relationship between searches and product views</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeSeriesData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="searches" stroke="#8884d8" name="Searches" />
                    <Line yAxisId="right" type="monotone" dataKey="product_views" stroke="#82ca9d" name="Product Views" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* User Activity Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Users</CardTitle>
              <CardDescription>Users with the most activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Events</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {userActivity.map((user, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-background' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.userId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{user.events}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(user.lastActive)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
                <CardDescription>Activity distribution by event type</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={eventTotals}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Event Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Duty Calculator Usage</CardTitle>
                <CardDescription>Daily usage of duty calculator</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeSeriesData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="calculate_duty" stroke="#8884d8" name="Calculator Usage" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
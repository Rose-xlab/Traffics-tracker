// app/admin/sync/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  RefreshCw, CheckCircle, XCircle, AlertCircle, 
  PlayCircle, Activity, Clock, Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiClient } from "@/lib/utils/api-client";

interface SyncJob {
  id: string;
  type: 'products' | 'tariffs' | 'updates' | 'full';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  itemsProcessed: number;
  totalItems: number;
}

export default function SyncPage() {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [activeJob, setActiveJob] = useState<SyncJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  // Load sync jobs
  useEffect(() => {
    async function fetchJobs() {
      try {
        setLoading(true);
        // In a real implementation, this would fetch from the API
        // const data = await ApiClient.get<SyncJob[]>('/api/admin/sync/jobs');
        
        // Mock data for demonstration
        const mockJobs: SyncJob[] = [
          {
            id: "job-1",
            type: "full",
            status: "completed",
            progress: 100,
            startedAt: "2025-04-01T10:00:00Z",
            completedAt: "2025-04-01T10:45:00Z",
            itemsProcessed: 1250,
            totalItems: 1250
          },
          {
            id: "job-2",
            type: "products",
            status: "completed",
            progress: 100,
            startedAt: "2025-04-02T08:30:00Z",
            completedAt: "2025-04-02T09:15:00Z",
            itemsProcessed: 500,
            totalItems: 500
          },
          {
            id: "job-3",
            type: "tariffs",
            status: "failed",
            progress: 45,
            startedAt: "2025-04-02T14:00:00Z",
            completedAt: "2025-04-02T14:20:00Z",
            error: "API rate limit exceeded",
            itemsProcessed: 225,
            totalItems: 500
          }
        ];
        
        setJobs(mockJobs);
        
        // Check if there's an active job
        const running = mockJobs.find(job => job.status === 'running');
        setActiveJob(running || null);
        setIsRunning(!!running);
      } catch (error) {
        console.error("Error fetching sync jobs:", error);
        toast({
          title: "Error",
          description: "Failed to load sync jobs",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
    
    // Set up polling for active job status
    const interval = setInterval(() => {
      if (activeJob) {
        // In a real implementation, this would fetch the latest job status
        // const updatedJob = await ApiClient.get<SyncJob>(`/api/admin/sync/jobs/${activeJob.id}`);
        // setActiveJob(updatedJob);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [toast]);

  // Start a new sync job
  const startSync = async (type: SyncJob['type']) => {
    try {
      setIsRunning(true);
      
      // In a real implementation, this would call the API
      // const newJob = await ApiClient.post<SyncJob>('/api/admin/sync/start', { type });
      
      // Mock a new job for demonstration
      const newJob: SyncJob = {
        id: `job-${Date.now()}`,
        type,
        status: "running",
        progress: 0,
        startedAt: new Date().toISOString(),
        itemsProcessed: 0,
        totalItems: type === 'products' ? 500 : type === 'tariffs' ? 1000 : type === 'updates' ? 50 : 1550
      };
      
      setActiveJob(newJob);
      setJobs([newJob, ...jobs]);
      
      toast({
        title: "Sync Started",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} sync has been initiated`,
      });
      
      // Simulate progress updates
      simulateJobProgress(newJob);
    } catch (error) {
      console.error(`Error starting ${type} sync:`, error);
      setIsRunning(false);
      toast({
        title: "Error",
        description: `Failed to start ${type} sync`,
        variant: "destructive"
      });
    }
  };
  
  // Simulate job progress for demo purposes
  const simulateJobProgress = (job: SyncJob) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Update job status
        const updatedJob = {
          ...job,
          status: "completed" as const,
          progress: 100,
          completedAt: new Date().toISOString(),
          itemsProcessed: job.totalItems
        };
        
        setActiveJob(null);
        setIsRunning(false);
        setJobs(jobs.map(j => j.id === job.id ? updatedJob : j));
        
        toast({
          title: "Sync Completed",
          description: `${job.type.charAt(0).toUpperCase() + job.type.slice(1)} sync has completed successfully`,
        });
      } else {
        // Update in-progress job
        const itemsProcessed = Math.floor((progress / 100) * job.totalItems);
        const updatedJob = {
          ...job,
          progress: Math.floor(progress),
          itemsProcessed
        };
        
        setActiveJob(updatedJob);
        setJobs(jobs.map(j => j.id === job.id ? updatedJob : j));
      }
    }, 1000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString();
  };
  
  // Get status badge
  const getStatusBadge = (status: SyncJob['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'running':
        return <Badge className="bg-blue-500 flex items-center gap-1"><Activity className="h-3 w-3" /> Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-36 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Data Synchronization</h1>
        <p className="text-muted-foreground">
          Manage data synchronization with external sources.
        </p>
      </div>

      {/* Active Job Section */}
      {activeJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active Sync Job</span>
              {getStatusBadge(activeJob.status)}
            </CardTitle>
            <CardDescription>
              Started at {formatDate(activeJob.startedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress:</span>
                <span className="text-sm">{activeJob.progress}%</span>
              </div>
              <Progress value={activeJob.progress} className="h-2" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Items Processed:</span>
              <span className="text-sm font-medium">{activeJob.itemsProcessed.toLocaleString()} / {activeJob.totalItems.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Type:</span>
              <span className="text-sm font-medium capitalize">{activeJob.type}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Products Sync</CardTitle>
            <CardDescription>
              Synchronize product data from external sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => startSync('products')}
              disabled={isRunning}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Products
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tariffs Sync</CardTitle>
            <CardDescription>
              Synchronize tariff rates and trade agreements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => startSync('tariffs')}
              disabled={isRunning}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Tariffs
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Updates Sync</CardTitle>
            <CardDescription>
              Synchronize trade policy updates and notices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => startSync('updates')}
              disabled={isRunning}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Updates
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Full Synchronization</CardTitle>
          <CardDescription>
            Synchronize all data sources in one operation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => startSync('full')}
              disabled={isRunning}
              className="flex-1"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Start Full Sync
            </Button>
            <Button
              variant="outline"
              disabled={isRunning}
              className="flex-1"
            >
              <Clock className="mr-2 h-4 w-4" />
              Schedule Sync
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>
            Recent synchronization jobs and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="tariffs">Tariffs</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {jobs.length === 0 ? (
                <div className="text-center py-6">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No sync jobs found</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-md">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium capitalize">{job.type} Sync</span>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(job.startedAt)} 
                        {job.completedAt && ` — ${formatDate(job.completedAt)}`}
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <div className="text-sm">
                        {job.itemsProcessed.toLocaleString()} / {job.totalItems.toLocaleString()} items processed
                      </div>
                      {job.error && (
                        <div className="text-sm text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {job.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="products" className="space-y-4">
              {jobs.filter(job => job.type === 'products').length === 0 ? (
                <div className="text-center py-6">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No product sync jobs found</p>
                </div>
              ) : (
                jobs.filter(job => job.type === 'products').map((job) => (
                  <div key={job.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-md">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">Products Sync</span>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(job.startedAt)} 
                        {job.completedAt && ` — ${formatDate(job.completedAt)}`}
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <div className="text-sm">
                        {job.itemsProcessed.toLocaleString()} / {job.totalItems.toLocaleString()} items processed
                      </div>
                      {job.error && (
                        <div className="text-sm text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {job.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="tariffs" className="space-y-4">
              {jobs.filter(job => job.type === 'tariffs').length === 0 ? (
                <div className="text-center py-6">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tariff sync jobs found</p>
                </div>
              ) : (
                jobs.filter(job => job.type === 'tariffs').map((job) => (
                  <div key={job.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-md">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">Tariffs Sync</span>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(job.startedAt)} 
                        {job.completedAt && ` — ${formatDate(job.completedAt)}`}
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <div className="text-sm">
                        {job.itemsProcessed.toLocaleString()} / {job.totalItems.toLocaleString()} items processed
                      </div>
                      {job.error && (
                        <div className="text-sm text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {job.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="updates" className="space-y-4">
              {jobs.filter(job => job.type === 'updates').length === 0 ? (
                <div className="text-center py-6">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No update sync jobs found</p>
                </div>
              ) : (
                jobs.filter(job => job.type === 'updates').map((job) => (
                  <div key={job.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-md">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">Updates Sync</span>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(job.startedAt)} 
                        {job.completedAt && ` — ${formatDate(job.completedAt)}`}
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <div className="text-sm">
                        {job.itemsProcessed.toLocaleString()} / {job.totalItems.toLocaleString()} items processed
                      </div>
                      {job.error && (
                        <div className="text-sm text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="h-3 w-3" /> {job.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
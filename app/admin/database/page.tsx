// app/admin/database/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle,
  Download,
  RefreshCw,
  Database,
  Table,
  FileText,
  ArrowRight,
  Play,
  HelpCircle,
  Archive,
  AlertTriangle,
  CheckCircle2,
  ServerCrash,
  Shield,
  ClipboardList,
  Trash2,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface TableInfo {
  name: string;
  rows: number;
  size: string;
  lastUpdated: string;
}

interface BackupInfo {
  id: string;
  timestamp: string;
  size: string;
  tables: string[];
  status: 'complete' | 'in_progress' | 'failed';
}

interface DatabaseStatus {
  connection: 'healthy' | 'degraded' | 'down';
  uptime: string;
  version: string;
  size: string;
  maxConnections: number;
  activeConnections: number;
  cpu: number;
  memory: number;
  diskUsage: number;
}

export default function AdminDatabasePage() {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, these would be API calls
      // const tablesData = await ApiClient.get('/api/admin/database/tables');
      // const backupsData = await ApiClient.get('/api/admin/database/backups');
      // const statusData = await ApiClient.get('/api/admin/database/status');
      
      // Mock data for demonstration
      const mockTables: TableInfo[] = [
        { name: 'products', rows: 1243, size: '256 MB', lastUpdated: '2025-04-02T15:30:00Z' },
        { name: 'countries', rows: 87, size: '32 MB', lastUpdated: '2025-04-01T12:45:00Z' },
        { name: 'tariff_rates', rows: 4562, size: '512 MB', lastUpdated: '2025-04-03T08:15:00Z' },
        { name: 'trade_updates', rows: 156, size: '48 MB', lastUpdated: '2025-04-02T18:20:00Z' },
        { name: 'user_watchlists', rows: 826, size: '128 MB', lastUpdated: '2025-04-03T11:30:00Z' },
        { name: 'notifications', rows: 3245, size: '256 MB', lastUpdated: '2025-04-03T14:10:00Z' },
        { name: 'analytics_events', rows: 15782, size: '1.2 GB', lastUpdated: '2025-04-03T16:45:00Z' },
        { name: 'compliance_requirements', rows: 437, size: '64 MB', lastUpdated: '2025-04-01T09:30:00Z' },
        { name: 'search_suggestions', rows: 728, size: '48 MB', lastUpdated: '2025-04-03T13:20:00Z' },
      ];
      
      const mockBackups: BackupInfo[] = [
        { 
          id: 'bkp-1', 
          timestamp: '2025-04-03T00:00:00Z', 
          size: '2.4 GB', 
          tables: ['All Tables'], 
          status: 'complete' 
        },
        { 
          id: 'bkp-2', 
          timestamp: '2025-04-02T00:00:00Z', 
          size: '2.3 GB', 
          tables: ['All Tables'], 
          status: 'complete' 
        },
        { 
          id: 'bkp-3', 
          timestamp: '2025-04-01T00:00:00Z', 
          size: '2.3 GB', 
          tables: ['All Tables'], 
          status: 'complete' 
        },
        { 
          id: 'bkp-4', 
          timestamp: '2025-03-31T12:00:00Z', 
          size: '512 MB', 
          tables: ['products', 'tariff_rates', 'countries'], 
          status: 'complete' 
        },
        { 
          id: 'bkp-5', 
          timestamp: '2025-03-30T00:00:00Z', 
          size: '2.2 GB', 
          tables: ['All Tables'], 
          status: 'complete' 
        },
      ];
      
      const mockStatus: DatabaseStatus = {
        connection: 'healthy',
        uptime: '15 days, 7 hours',
        version: 'PostgreSQL 14.8',
        size: '4.8 GB',
        maxConnections: 100,
        activeConnections: 8,
        cpu: 12,
        memory: 65,
        diskUsage: 48
      };
      
      setTables(mockTables);
      setBackups(mockBackups);
      setDbStatus(mockStatus);
      
    } catch (error) {
      console.error("Error loading database info:", error);
      toast({
        title: "Error",
        description: "Failed to load database information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const executeQuery = async () => {
    if (!sqlQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a query to execute",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setQueryLoading(true);
      
      // In a real implementation, this would be an API call
      // const result = await ApiClient.post('/api/admin/database/query', { query: sqlQuery });
      
      // Mock query execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simple mock response for demo purposes
      const mockResult = {
        rows: Array.from({ length: 5 }).map((_, i) => ({
          id: `id-${i + 1}`,
          name: `Result ${i + 1}`,
          value: Math.floor(Math.random() * 1000),
          created_at: new Date().toISOString()
        })),
        rowCount: 5,
        duration: '0.123s'
      };
      
      setQueryResult(mockResult);
      
      toast({
        title: "Query executed",
        description: `Query completed in ${mockResult.duration} with ${mockResult.rowCount} results`,
      });
    } catch (error) {
      console.error("Error executing query:", error);
      
      // Show mock error
      setQueryResult({
        error: "Syntax error in SQL query",
        details: "ERROR: syntax error at or near 'invalid'",
        position: 15
      });
      
      toast({
        title: "Query error",
        description: "Error executing SQL query",
        variant: "destructive"
      });
    } finally {
      setQueryLoading(false);
    }
  };

  const createBackup = async (tables: string[]) => {
    try {
      // In a real implementation, this would be an API call
      // await ApiClient.post('/api/admin/database/backup', { tables });
      
      // Mock backup creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add mock backup to list
      const newBackup: BackupInfo = {
        id: `bkp-${new Date().getTime()}`,
        timestamp: new Date().toISOString(),
        size: tables.length === tables.length ? '2.4 GB' : '512 MB',
        tables: tables.length === tables.length ? ['All Tables'] : tables,
        status: 'in_progress'
      };
      
      setBackups([newBackup, ...backups]);
      setBackupDialogOpen(false);
      
      // Mock backup completion after a delay
      setTimeout(() => {
        setBackups(prev => prev.map(b => 
          b.id === newBackup.id ? { ...b, status: 'complete' } : b
        ));
        
        toast({
          title: "Backup completed",
          description: "Database backup completed successfully"
        });
      }, 5000);
      
      toast({
        title: "Backup started",
        description: "Database backup has been initiated"
      });
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "Backup error",
        description: "Failed to create database backup",
        variant: "destructive"
      });
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (!confirm("Are you sure you want to restore this backup? This will overwrite current data.")) {
      return;
    }
    
    try {
      // In a real implementation, this would be an API call
      // await ApiClient.post(`/api/admin/database/restore/${backupId}`);
      
      // Mock restore operation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Restore completed",
        description: "Database has been restored from backup"
      });
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast({
        title: "Restore error",
        description: "Failed to restore database from backup",
        variant: "destructive"
      });
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm("Are you sure you want to delete this backup? This action cannot be undone.")) {
      return;
    }
    
    try {
      // In a real implementation, this would be an API call
      // await ApiClient.delete(`/api/admin/database/backups/${backupId}`);
      
      // Update local state
      setBackups(backups.filter(b => b.id !== backupId));
      
      toast({
        title: "Backup deleted",
        description: "Database backup has been deleted"
      });
    } catch (error) {
      console.error("Error deleting backup:", error);
      toast({
        title: "Delete error",
        description: "Failed to delete database backup",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const toggleSelectTable = (tableName: string) => {
    if (selectedTables.includes(tableName)) {
      setSelectedTables(selectedTables.filter(t => t !== tableName));
    } else {
      setSelectedTables([...selectedTables, tableName]);
    }
  };

  const selectAllTables = () => {
    if (selectedTables.length === tables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(tables.map(t => t.name));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Database Management</h1>
        <p className="text-muted-foreground">
          Manage database tables, run queries, and handle backups.
        </p>
      </div>

      {/* Database Status Section */}
      {dbStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Database Status</CardTitle>
              <Badge 
                variant={
                  dbStatus.connection === 'healthy' ? 'default' :
                  dbStatus.connection === 'degraded' ? 'warning' : 'destructive'
                }
                className="flex items-center gap-1"
              >
                {dbStatus.connection === 'healthy' ? (
                  <><CheckCircle2 className="h-3.5 w-3.5" /> Healthy</>
                ) : dbStatus.connection === 'degraded' ? (
                  <><AlertTriangle className="h-3.5 w-3.5" /> Degraded</>
                ) : (
                  <><ServerCrash className="h-3.5 w-3.5" /> Offline</>
                )}
              </Badge>
            </div>
            <CardDescription>
              Current database status and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Database</span>
                  <span className="text-sm">{dbStatus.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uptime</span>
                  <span className="text-sm">{dbStatus.uptime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Size</span>
                  <span className="text-sm">{dbStatus.size}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connections</span>
                  <span className="text-sm">{dbStatus.activeConnections} / {dbStatus.maxConnections}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">CPU Usage</span>
                  <span className="text-sm">{dbStatus.cpu}%</span>
                </div>
                <Progress value={dbStatus.cpu} className="h-2" />
                <div className="flex items-center justify-between mb-1 mt-3">
                  <span className="text-sm font-medium">Memory Usage</span>
                  <span className="text-sm">{dbStatus.memory}%</span>
                </div>
                <Progress value={dbStatus.memory} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Disk Usage</span>
                  <span className="text-sm">{dbStatus.diskUsage}%</span>
                </div>
                <Progress value={dbStatus.diskUsage} className="h-2" />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-medium">Last Backup</span>
                  <span className="text-sm">{backups.length > 0 ? formatDate(backups[0].timestamp) : 'None'}</span>
                </div>
              </div>

              <div className="flex flex-col justify-center space-y-2">
                <Button onClick={() => setBackupDialogOpen(true)} className="w-full">
                  <Archive className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
                <Button variant="outline" onClick={loadDatabaseInfo} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Database Content */}
      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="query" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            SQL Query
          </TabsTrigger>
          <TabsTrigger value="backups" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Backups
          </TabsTrigger>
        </TabsList>
        
        {/* Tables Tab */}
        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>
                View and manage database tables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Table Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rows</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Updated</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {tables.map((table, i) => (
                      <tr key={table.name} className={i % 2 === 0 ? 'bg-background' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{table.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{table.rows.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{table.size}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(table.lastUpdated)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <a href="#" onClick={(e) => {
                                e.preventDefault();
                                setSqlQuery(`SELECT * FROM ${table.name} LIMIT 100;`);
                                document.querySelector('[data-value="query"]')?.click();
                              }}>
                                Query
                              </a>
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Export
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* SQL Query Tab */}
        <TabsContent value="query">
          <Card>
            <CardHeader>
              <CardTitle>SQL Query Console</CardTitle>
              <CardDescription>
                Execute SQL queries directly against the database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="query">SQL Query</Label>
                <Textarea
                  id="query"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="SELECT * FROM products LIMIT 10;"
                  className="font-mono min-h-[150px]"
                />
                <p className="text-sm text-muted-foreground">
                  <HelpCircle className="h-3 w-3 inline-block mr-1" />
                  Use with caution. Only SELECT queries are recommended in production.
                </p>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={executeQuery} disabled={queryLoading} className="flex items-center">
                  {queryLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Execute Query
                </Button>
              </div>
              
              {queryResult && (
                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">
                    {queryResult.error ? (
                      <span className="text-destructive">Query Error</span>
                    ) : (
                      <span>Result: {queryResult.rowCount} rows in {queryResult.duration}</span>
                    )}
                  </div>
                  
                  {queryResult.error ? (
                    <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
                      <p className="font-medium">{queryResult.error}</p>
                      <p className="text-sm mt-1">{queryResult.details}</p>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-auto max-h-[400px]">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            {queryResult.rows[0] && Object.keys(queryResult.rows[0]).map(key => (
                              <th key={key} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                          {queryResult.rows.map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-background' : ''}>
                              {Object.values(row).map((value: any, j) => (
                                <td key={j} className="px-6 py-4 whitespace-nowrap text-sm">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Backups Tab */}
        <TabsContent value="backups">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Database Backups</CardTitle>
                <Button onClick={() => setBackupDialogOpen(true)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </div>
              <CardDescription>
                Manage database backups and restores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tables</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {backups.map((backup, i) => (
                      <tr key={backup.id} className={i % 2 === 0 ? 'bg-background' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatDate(backup.timestamp)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{backup.size}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{backup.tables.join(', ')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge 
                            variant={
                              backup.status === 'complete' ? 'default' :
                              backup.status === 'in_progress' ? 'secondary' : 'destructive'
                            }
                          >
                            {backup.status === 'complete' ? 'Complete' :
                             backup.status === 'in_progress' ? 'In Progress' : 'Failed'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => restoreBackup(backup.id)}
                              disabled={backup.status !== 'complete'}
                            >
                              Restore
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteBackup(backup.id)}
                              disabled={backup.status === 'in_progress'}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {backups.length === 0 && (
                <div className="text-center py-6">
                  <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No backups found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Backup Dialog */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Database Backup</DialogTitle>
            <DialogDescription>
              Select tables to include in the backup or choose all tables.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedTables.length === tables.length}
                onCheckedChange={selectAllTables}
              />
              <Label htmlFor="select-all" className="font-medium">Select All Tables</Label>
            </div>
            <div className="max-h-[200px] overflow-auto border rounded-md p-2">
              {tables.map(table => (
                <div key={table.name} className="flex items-center gap-2 py-1">
                  <Checkbox
                    id={`table-${table.name}`}
                    checked={selectedTables.includes(table.name)}
                    onCheckedChange={() => toggleSelectTable(table.name)}
                  />
                  <Label htmlFor={`table-${table.name}`} className="text-sm">{table.name}</Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBackupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createBackup(selectedTables)}
              disabled={selectedTables.length === 0}
            >
              Create Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
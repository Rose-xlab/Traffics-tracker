// app/admin/updates/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnDef,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpDown,
  Plus,
  Search,
  FileEdit,
  Trash2,
  FileText,
  Calendar,
  ExternalLink,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";
import type { TradeUpdate } from "@/types";

export default function AdminUpdatesPage() {
  const [updates, setUpdates] = useState<TradeUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [editingUpdate, setEditingUpdate] = useState<TradeUpdate | null>(null);
  const [newUpdateDialogOpen, setNewUpdateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [filterImpact, setFilterImpact] = useState<string>("all");
  const { toast } = useToast();

  // Define table columns
  const columns: ColumnDef<TradeUpdate>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium max-w-md truncate">
          {row.getValue("title")}
        </div>
      ),
    },
    {
      accessorKey: "publishedDate",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent whitespace-nowrap"
        >
          Date Published
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          {formatDate(row.getValue("publishedDate"))}
        </div>
      ),
    },
    {
      accessorKey: "impact",
      header: "Impact",
      cell: ({ row }) => {
        const impact = row.getValue("impact") as 'low' | 'medium' | 'high';
        return (
          <Badge 
            variant={
              impact === 'high' ? 'destructive' : 
              impact === 'medium' ? 'default' : 
              'secondary'
            }
          >
            {impact.charAt(0).toUpperCase() + impact.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "sourceUrl",
      header: "Source",
      cell: ({ row }) => {
        const sourceUrl = row.getValue("sourceUrl") as string;
        return sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Source
          </a>
        ) : (
          <span className="text-muted-foreground">None</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const update = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditUpdate(update)}
            >
              <FileEdit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteUpdate(update.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Fetch updates
  useEffect(() => {
    async function fetchUpdates() {
      try {
        setLoading(true);
        // Fetch trade updates from the API
        const response = await fetch('/api/admin/updates');
        
        if (!response.ok) {
          throw new Error(`Error fetching updates: ${response.statusText}`);
        }
        
        const data = await response.json();
        setUpdates(data);
      } catch (error) {
        console.error("Error fetching trade updates:", error);
        toast({
          title: "Error",
          description: "Failed to load trade updates",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUpdates();
  }, [toast]);

  // Handle edit update
  const handleEditUpdate = (update: TradeUpdate) => {
    setEditingUpdate(update);
    setEditDialogOpen(true);
  };

  // Handle save update changes
  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUpdate) return;

    try {
      // Update the trade update via API
      const response = await fetch(`/api/admin/updates/${editingUpdate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUpdate)
      });
      
      if (!response.ok) {
        throw new Error(`Error updating trade update: ${response.statusText}`);
      }
      
      // Update local state
      setUpdates(updates.map(u => 
        u.id === editingUpdate.id ? editingUpdate : u
      ));
      
      setEditDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Trade update modified successfully",
      });
    } catch (error) {
      console.error("Error updating trade update:", error);
      toast({
        title: "Error",
        description: "Failed to update trade update",
        variant: "destructive"
      });
    }
  };

  // Handle create new update
  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a new update object from form data
    const formData = new FormData(e.target as HTMLFormElement);
    const newUpdate = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      impact: formData.get('impact') as 'low' | 'medium' | 'high',
      sourceUrl: formData.get('sourceUrl') as string || undefined,
      sourceReference: formData.get('sourceReference') as string,
      publishedDate: formData.get('publishedDate') as string,
    };

    try {
      // Send the new update to the API
      const response = await fetch('/api/admin/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUpdate)
      });
      
      if (!response.ok) {
        throw new Error(`Error creating trade update: ${response.statusText}`);
      }
      
      const createdUpdate = await response.json();
      
      // Update local state
      setUpdates([createdUpdate, ...updates]);
      
      setNewUpdateDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Trade update created successfully",
      });
      
      // Reset the form
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error creating trade update:", error);
      toast({
        title: "Error",
        description: "Failed to create trade update",
        variant: "destructive"
      });
    }
  };

  // Handle delete update
  const handleDeleteUpdate = async (updateId: string) => {
    if (confirm("Are you sure you want to delete this trade update?")) {
      try {
        // Delete the update via API
        const response = await fetch(`/api/admin/updates/${updateId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`Error deleting trade update: ${response.statusText}`);
        }
        
        // Update local state
        setUpdates(updates.filter(u => u.id !== updateId));
        
        toast({
          title: "Success",
          description: "Trade update deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting trade update:", error);
        toast({
          title: "Error",
          description: "Failed to delete trade update",
          variant: "destructive"
        });
      }
    }
  };
  
  // Filtered updates based on impact level
  const filteredUpdates = filterImpact === "all" 
    ? updates 
    : updates.filter(update => update.impact === filterImpact);
  
  // Create table instance
  const table = useReactTable({
    data: filteredUpdates,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trade Updates</h1>
          <p className="text-muted-foreground">
            Manage trade policy updates and notices.
          </p>
        </div>
        <Button onClick={() => setNewUpdateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Update
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Trade Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 py-4">
            <div className="relative flex-grow max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search updates..."
                value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("title")?.setFilterValue(event.target.value)
                }
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={filterImpact}
                onValueChange={setFilterImpact}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by impact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Updates</SelectItem>
                  <SelectItem value="high">High Impact</SelectItem>
                  <SelectItem value="medium">Medium Impact</SelectItem>
                  <SelectItem value="low">Low Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No trade updates found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} update(s) total
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Trade Update Dialog */}
      <Dialog open={newUpdateDialogOpen} onOpenChange={setNewUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Trade Update</DialogTitle>
            <DialogDescription>
              Add a new trade policy update or notice.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUpdate}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Trade Update Title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={4} placeholder="Detailed information about the update..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="impact">Impact Level</Label>
                  <Select name="impact" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue placeholder="Select impact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publishedDate">Published Date</Label>
                  <Input 
                    id="publishedDate" 
                    name="publishedDate" 
                    type="date" 
                    defaultValue={new Date().toISOString().split('T')[0]} 
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceUrl">Source URL (optional)</Label>
                <Input id="sourceUrl" name="sourceUrl" placeholder="https://example.com/source" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceReference">Source Reference</Label>
                <Input id="sourceReference" name="sourceReference" placeholder="Document number or reference" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Trade Update Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Trade Update</DialogTitle>
            <DialogDescription>
              Update the trade policy information.
            </DialogDescription>
          </DialogHeader>
          {editingUpdate && (
            <form onSubmit={handleSaveEdits}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingUpdate.title}
                    onChange={(e) => setEditingUpdate({...editingUpdate, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingUpdate.description}
                    onChange={(e) => setEditingUpdate({...editingUpdate, description: e.target.value})}
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-impact">Impact Level</Label>
                    <Select
                      value={editingUpdate.impact}
                      onValueChange={(value) => setEditingUpdate({
                        ...editingUpdate, 
                        impact: value as 'low' | 'medium' | 'high'
                      })}
                    >
                      <SelectTrigger id="edit-impact">
                        <SelectValue placeholder="Select impact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-date">Published Date</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={new Date(editingUpdate.publishedDate).toISOString().split('T')[0]}
                      onChange={(e) => setEditingUpdate({...editingUpdate, publishedDate: new Date(e.target.value).toISOString()})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-source-url">Source URL</Label>
                  <Input
                    id="edit-source-url"
                    value={editingUpdate.sourceUrl || ''}
                    onChange={(e) => setEditingUpdate({...editingUpdate, sourceUrl: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-source-reference">Source Reference</Label>
                  <Input
                    id="edit-source-reference"
                    value={editingUpdate.sourceReference || ''}
                    onChange={(e) => setEditingUpdate({...editingUpdate, sourceReference: e.target.value})}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
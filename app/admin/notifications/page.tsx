// app/admin/notifications/page.tsx
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
  Search,
  MessageCircle,
  Eye,
  EyeOff,
  Trash2,
  BellRing,
  Filter,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils/format";
import type { Notification } from "@/types/notifications";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [newNotificationDialogOpen, setNewNotificationDialogOpen] = useState(false);
  const [viewNotificationDialogOpen, setViewNotificationDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const { toast } = useToast();

  // Define table columns
  const columns: ColumnDef<Notification>[] = [
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
        <div className="font-medium max-w-xs truncate">
          {!row.original.read && (
            <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2" />
          )}
          {row.getValue("title")}
        </div>
      ),
    },
    {
      accessorKey: "user_id",
      header: "Recipient",
      cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue("user_id")}</div>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        let badgeVariant:
          | "default"
          | "secondary"
          | "destructive"
          | "outline" = "default";
        
        switch (type) {
          case "rate_change":
            badgeVariant = "default";
            break;
          case "new_ruling":
            badgeVariant = "secondary";
            break;
          case "exclusion":
            badgeVariant = "destructive";
            break;
          case "system":
          default:
            badgeVariant = "outline";
            break;
        }
        
        return (
          <Badge variant={badgeVariant}>
            {type.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "read",
      header: "Status",
      cell: ({ row }) => {
        const isRead = row.getValue("read") as boolean;
        return (
          <Badge variant={isRead ? "outline" : "default"}>
            {isRead ? "Read" : "Unread"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Date Sent
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          {formatDate(row.getValue("created_at"))}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const notification = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewNotification(notification)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleReadStatus(notification)}
            >
              {notification.read ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteNotification(notification.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/notifications');
        
        if (!response.ok) {
          throw new Error(`Error fetching notifications: ${response.statusText}`);
        }
        
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast({
          title: "Error",
          description: "Failed to load notifications",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, [toast]);

  // View notification details
  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setViewNotificationDialogOpen(true);
    
    // If notification is unread, mark it as read
    if (!notification.read) {
      handleToggleReadStatus(notification, true);
    }
  };

  // Toggle read status
  const handleToggleReadStatus = async (notification: Notification, skipConfirm = false) => {
    if (!skipConfirm && notification.read) {
      if (!confirm("Are you sure you want to mark this notification as unread?")) {
        return;
      }
    }

    try {
      const newReadStatus = !notification.read;
      
      const response = await fetch(`/api/admin/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: newReadStatus })
      });
      
      if (!response.ok) {
        throw new Error(`Error updating notification: ${response.statusText}`);
      }
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notification.id ? { ...n, read: newReadStatus } : n
      ));
      
      // Also update selected notification if it's the same one
      if (selectedNotification && selectedNotification.id === notification.id) {
        setSelectedNotification({ ...selectedNotification, read: newReadStatus });
      }
      
      toast({
        title: "Success",
        description: `Notification marked as ${newReadStatus ? 'read' : 'unread'}`,
      });
    } catch (error) {
      console.error("Error updating notification:", error);
      toast({
        title: "Error",
        description: "Failed to update notification",
        variant: "destructive"
      });
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting notification: ${response.statusText}`);
      }
      
      // Update local state
      setNotifications(notifications.filter(n => n.id !== notificationId));
      
      toast({
        title: "Success",
        description: "Notification deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      });
    }
  };

  // Send new notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a new notification object from form data
    const formData = new FormData(e.target as HTMLFormElement);
    const newNotification = {
      title: formData.get('title') as string,
      message: formData.get('message') as string,
      type: formData.get('type') as string,
      user_id: formData.get('user_id') as string || undefined,
      all_users: formData.get('user_id') ? false : true
    };

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      });
      
      if (!response.ok) {
        throw new Error(`Error sending notification: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update local state if we have the new notifications
      if (Array.isArray(result)) {
        setNotifications([...result, ...notifications]);
      } else {
        // Reload notifications to get the latest
        const refreshResponse = await fetch('/api/admin/notifications');
        const refreshData = await refreshResponse.json();
        setNotifications(refreshData);
      }
      
      setNewNotificationDialogOpen(false);
      
      toast({
        title: "Success",
        description: `Notification${newNotification.all_users ? 's' : ''} sent successfully`,
      });
      
      // Reset the form
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      });
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    let filtered = [...notifications];
    
    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(notification => notification.type === filterType);
    }
    
    // Filter by read status
    if (filterRead !== "all") {
      const isRead = filterRead === "read";
      filtered = filtered.filter(notification => notification.read === isRead);
    }
    
    return filtered;
  };
  
  // Get filtered notifications
  const filteredNotifications = applyFilters();
  
  // Create table instance
  const table = useReactTable({
    data: filteredNotifications,
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
    initialState: {
      sorting: [
        { id: "created_at", desc: true }
      ],
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
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Manage system notifications and messages to users.
          </p>
        </div>
        <Button onClick={() => setNewNotificationDialogOpen(true)}>
          <MessageCircle className="mr-2 h-4 w-4" /> Send Notification
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 py-4">
            <div className="relative flex-grow max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
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
                value={filterType}
                onValueChange={setFilterType}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="rate_change">Rate Change</SelectItem>
                  <SelectItem value="new_ruling">New Ruling</SelectItem>
                  <SelectItem value="exclusion">Exclusion</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Select
                value={filterRead}
                onValueChange={setFilterRead}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
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
                      No notifications found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} notification(s) found
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

      {/* Send Notification Dialog */}
      <Dialog open={newNotificationDialogOpen} onOpenChange={setNewNotificationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send a notification to a specific user or all users.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSendNotification}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">Recipient (leave empty for all users)</Label>
                <Input id="user_id" name="user_id" placeholder="User ID (optional)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Notification Title</Label>
                <Input id="title" name="title" placeholder="Notification Title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" rows={4} placeholder="Notification message..." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Notification Type</Label>
                <Select name="type" defaultValue="system">
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rate_change">Rate Change</SelectItem>
                    <SelectItem value="new_ruling">New Ruling</SelectItem>
                    <SelectItem value="exclusion">Exclusion</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewNotificationDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Send className="mr-2 h-4 w-4" />
                Send Notification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Notification Dialog */}
      <Dialog open={viewNotificationDialogOpen} onOpenChange={setViewNotificationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
            <div className="flex justify-between items-center mt-2">
              <Badge variant={selectedNotification?.type === 'rate_change' ? 'default' : 
                selectedNotification?.type === 'new_ruling' ? 'secondary' : 
                selectedNotification?.type === 'exclusion' ? 'destructive' : 
                'outline'}>
                {selectedNotification?.type?.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {selectedNotification ? formatDate(selectedNotification.created_at) : ''}
              </span>
            </div>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <div className="p-2 border rounded-md bg-muted">
                {selectedNotification?.user_id}
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <Label>Message</Label>
              <div className="p-4 border rounded-md whitespace-pre-wrap">
                {selectedNotification?.message}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewNotificationDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
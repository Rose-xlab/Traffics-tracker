// app/admin/users/page.tsx
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
  ColumnFiltersState,
  ColumnDef,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDown,
  Search,
  Plus,
  FileEdit,
  Trash2,
  Mail,
  ShieldAlert,
  ShieldCheck,
  FilterX,
  UserCog,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  last_login: string;
  status: 'active' | 'inactive' | 'suspended';
  company?: string;
  full_name?: string;
  watchlist_count: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        // In a real implementation, this would call the API
        // const data = await ApiClient.get<User[]>('/api/admin/users');
        
        // Mock data for demonstration
        const mockUsers: User[] = Array.from({ length: 20 }).map((_, i) => ({
          id: `user-${i + 1}`,
          email: `user${i + 1}@example.com`,
          is_admin: i < 2,
          created_at: new Date(Date.now() - (i * 86400000 * (Math.random() * 30))).toISOString(),
          last_login: new Date(Date.now() - (i * 3600000 * (Math.random() * 24))).toISOString(),
          status: i % 10 === 0 ? 'suspended' : i % 5 === 0 ? 'inactive' : 'active',
          company: i % 3 === 0 ? `Company ${i}` : undefined,
          full_name: `User ${i + 1}`,
          watchlist_count: Math.floor(Math.random() * 10),
        }));
        
        setUsers(mockUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [toast]);

  // Handle editing a user
  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setOpenDialog(true);
  };

  // Handle sending an email to a user
  const handleSendEmail = (user: User) => {
    toast({
      title: "Email sent",
      description: `Email notification sent to ${user.email}`,
    });
  };

  // Handle toggling user status
  const handleToggleStatus = (user: User) => {
    if (user.status !== 'suspended') {
      if (confirm(`Are you sure you want to suspend user ${user.email}?`)) {
        // Update user status
        const updatedUsers = users.map(u => 
          u.id === user.id ? { ...u, status: 'suspended' as const } : u
        );
        setUsers(updatedUsers);
        toast({
          title: "User suspended",
          description: `User ${user.email} has been suspended`
        });
      }
    } else {
      // Reactivate user
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, status: 'active' as const } : u
      );
      setUsers(updatedUsers);
      toast({
        title: "User reactivated",
        description: `User ${user.email} has been reactivated`
      });
    }
  };

  // Handle deleting a user
  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      // In a real implementation, this would call the API
      // await ApiClient.delete(`/api/admin/users/${userId}`);
      
      // Update local state
      setUsers(users.filter(user => user.id !== userId));
      
      toast({
        title: "User deleted",
        description: "User has been deleted successfully"
      });
    }
  };

  // Handle saving user changes
  const handleSaveUser = (user: User) => {
    if (userToEdit) {
      // In a real implementation, this would call the API
      // await ApiClient.put(`/api/admin/users/${userToEdit.id}`, user);
      
      // Update local state
      const updatedUsers = users.map(u => 
        u.id === userToEdit.id ? user : u
      );
      setUsers(updatedUsers);
      
      setOpenDialog(false);
      setUserToEdit(null);
      
      toast({
        title: "User updated",
        description: "User has been updated successfully"
      });
    }
  };

  // Define table columns
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "full_name",
      header: "Name",
      cell: ({ row }) => (
        <div>{row.getValue("full_name") || "-"}</div>
      ),
    },
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }) => (
        <div>{row.getValue("company") || "-"}</div>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Joined
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>{new Date(row.getValue("created_at")).toLocaleDateString()}</div>
      ),
    },
    {
      accessorKey: "last_login",
      header: "Last Active",
      cell: ({ row }) => (
        <div>{new Date(row.getValue("last_login")).toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "watchlist_count",
      header: "Watchlist",
      cell: ({ row }) => (
        <div>{row.getValue("watchlist_count")}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge 
            variant={
              status === 'active' ? 'default' : 
              status === 'inactive' ? 'secondary' : 
              'destructive'
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "is_admin",
      header: "Role",
      cell: ({ row }) => {
        const isAdmin = row.getValue("is_admin") as boolean;
        return (
          <Badge variant={isAdmin ? "default" : "outline"}>
            {isAdmin ? (
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Admin</span>
              </div>
            ) : "User"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleEditUser(user)}
            >
              <UserCog className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleSendEmail(user)}
            >
              <Mail className="h-4 w-4" />
            </Button>
            {user.status !== 'suspended' ? (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleToggleStatus(user)}
              >
                <ShieldAlert className="h-4 w-4 text-destructive" />
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleToggleStatus(user)}
              >
                <ShieldCheck className="h-4 w-4 text-primary" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleDeleteUser(user.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Create table instance
  const table = useReactTable({
    data: users,
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
      globalFilter: statusFilter !== "all" ? { status: statusFilter } : undefined,
    },
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-4 gap-4">
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-10 w-40" />
            </div>
            <div className="rounded-md border">
              <div className="h-[400px] relative">
                <Skeleton className="absolute inset-0" />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
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
          <h1 className="text-3xl font-bold mb-2">Users</h1>
          <p className="text-muted-foreground">
            Manage users, permissions, and account status.
          </p>
        </div>
        <Button asChild>
          <Link href="#">
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all users in the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("email")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter" className="text-sm">Status:</Label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status-filter" className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              
              {statusFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setStatusFilter("all")}
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
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
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              Showing {table.getRowModel().rows.length} of{" "}
              {users.length} users
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

      {/* User Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions.
            </DialogDescription>
          </DialogHeader>
          {userToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={userToEdit.email} 
                  readOnly 
                  disabled 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input 
                  id="full_name" 
                  value={userToEdit.full_name || ''} 
                  onChange={(e) => setUserToEdit({...userToEdit, full_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input 
                  id="company" 
                  value={userToEdit.company || ''} 
                  onChange={(e) => setUserToEdit({...userToEdit, company: e.target.value})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="admin-status">Administrator</Label>
                  <div className="text-sm text-muted-foreground">
                    Grant administrative privileges
                  </div>
                </div>
                <Switch
                  id="admin-status"
                  checked={userToEdit.is_admin}
                  onCheckedChange={(checked) => setUserToEdit({...userToEdit, is_admin: checked})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={userToEdit.status} 
                  onValueChange={(value: 'active' | 'inactive' | 'suspended') => 
                    setUserToEdit({...userToEdit, status: value})
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSaveUser(userToEdit!)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
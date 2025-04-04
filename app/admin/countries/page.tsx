// app/admin/countries/page.tsx
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
  Globe,
  Flag,
  EyeIcon,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Country } from "@/types";

export default function AdminCountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [newCountryDialogOpen, setNewCountryDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Define table columns
  const columns: ColumnDef<Country>[] = [
    {
      accessorKey: "code",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Code
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium uppercase">{row.getValue("code")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0 hover:bg-transparent"
        >
          Country
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "flagUrl",
      header: "Flag",
      cell: ({ row }) => (
        <div className="relative w-10 h-6 rounded overflow-hidden">
          {row.getValue("flagUrl") ? (
            <img
              src={row.getValue("flagUrl") as string}
              alt={`${row.getValue("name")} flag`}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Flag className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "tradeAgreements",
      header: "Trade Agreements",
      cell: ({ row }) => {
        const agreements = row.getValue("tradeAgreements") as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {agreements && agreements.length > 0 ? (
              agreements.slice(0, 2).map((agreement, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {agreement}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">None</span>
            )}
            {agreements && agreements.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{agreements.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "specialTariffs",
      header: "Special Tariffs",
      cell: ({ row }) => {
        const tariffs = row.getValue("specialTariffs") as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {tariffs && tariffs.length > 0 ? (
              tariffs.map((tariff, i) => (
                <Badge key={i} variant="destructive" className="text-xs">
                  {tariff}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">None</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const country = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/countries/${country.id}`} target="_blank">
                <EyeIcon className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditCountry(country)}
            >
              <FileEdit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteCountry(country.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Fetch countries
  useEffect(() => {
    async function fetchCountries() {
      try {
        setLoading(true);
        // Fetch countries from the API
        const response = await fetch('/api/admin/countries');
        
        if (!response.ok) {
          throw new Error(`Error fetching countries: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCountries(data);
      } catch (error) {
        console.error("Error fetching countries:", error);
        toast({
          title: "Error",
          description: "Failed to load countries",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCountries();
  }, [toast]);

  // Handle edit country
  const handleEditCountry = (country: Country) => {
    setEditingCountry(country);
    setEditDialogOpen(true);
  };

  // Handle save country changes
  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCountry) return;

    try {
      // Update the country via API
      const response = await fetch(`/api/admin/countries/${editingCountry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCountry)
      });
      
      if (!response.ok) {
        throw new Error(`Error updating country: ${response.statusText}`);
      }
      
      // Update local state
      setCountries(countries.map(c => 
        c.id === editingCountry.id ? editingCountry : c
      ));
      
      setEditDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Country updated successfully",
      });
    } catch (error) {
      console.error("Error updating country:", error);
      toast({
        title: "Error",
        description: "Failed to update country",
        variant: "destructive"
      });
    }
  };

  // Handle create new country
  const handleCreateCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a new country object from form data
    const formData = new FormData(e.target as HTMLFormElement);
    const newCountry = {
      id: `country-${new Date().getTime()}`,
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      flagUrl: formData.get('flagUrl') as string || undefined,
      description: formData.get('description') as string,
      tradeAgreements: (formData.get('tradeAgreements') as string).split(',').map(s => s.trim()),
      specialTariffs: (formData.get('specialTariffs') as string).split(',').map(s => s.trim()).filter(Boolean),
    };

    try {
      // Send the new country to the API
      const response = await fetch('/api/admin/countries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCountry)
      });
      
      if (!response.ok) {
        throw new Error(`Error creating country: ${response.statusText}`);
      }
      
      const createdCountry = await response.json();
      
      // Update local state
      setCountries([...countries, createdCountry]);
      
      setNewCountryDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Country created successfully",
      });
      
      // Reset the form
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error creating country:", error);
      toast({
        title: "Error",
        description: "Failed to create country",
        variant: "destructive"
      });
    }
  };

  // Handle delete country
  const handleDeleteCountry = (countryId: string) => {
    if (confirm("Are you sure you want to delete this country?")) {
      try {
        // In a real implementation, this would call the API
        // await fetch(`/api/admin/countries/${countryId}`, {
        //   method: 'DELETE'
        // });
        
        // Update local state
        setCountries(countries.filter(c => c.id !== countryId));
        
        toast({
          title: "Success",
          description: "Country deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting country:", error);
        toast({
          title: "Error",
          description: "Failed to delete country",
          variant: "destructive"
        });
      }
    }
  };
  
  // Create table instance
  const table = useReactTable({
    data: countries,
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
          <h1 className="text-3xl font-bold mb-2">Countries</h1>
          <p className="text-muted-foreground">
            Manage countries and their trade agreements.
          </p>
        </div>
        <Button onClick={() => setNewCountryDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Country
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Countries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search countries..."
                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="pl-8 w-[300px]"
              />
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
                      No countries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} country(ies) total
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

      {/* Add Country Dialog */}
      <Dialog open={newCountryDialogOpen} onOpenChange={setNewCountryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Country</DialogTitle>
            <DialogDescription>
              Add a new country to the system. All fields are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCountry}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Country Code</Label>
                  <Input id="code" name="code" placeholder="US" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Country Name</Label>
                  <Input id="name" name="name" placeholder="United States" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="flagUrl">Flag URL (optional)</Label>
                <Input id="flagUrl" name="flagUrl" placeholder="https://example.com/flag.png" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradeAgreements">Trade Agreements (comma separated)</Label>
                <Input id="tradeAgreements" name="tradeAgreements" placeholder="USMCA, FTA" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialTariffs">Special Tariffs (comma separated)</Label>
                <Input id="specialTariffs" name="specialTariffs" placeholder="Section 301" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} placeholder="Country description..." required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewCountryDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Country</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Country Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Country</DialogTitle>
            <DialogDescription>
              Update country information and settings.
            </DialogDescription>
          </DialogHeader>
          {editingCountry && (
            <form onSubmit={handleSaveEdits}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-code">Country Code</Label>
                    <Input
                      id="edit-code"
                      value={editingCountry.code}
                      onChange={(e) => setEditingCountry({...editingCountry, code: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Country Name</Label>
                    <Input
                      id="edit-name"
                      value={editingCountry.name}
                      onChange={(e) => setEditingCountry({...editingCountry, name: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-flag">Flag URL</Label>
                  <Input
                    id="edit-flag"
                    value={editingCountry.flagUrl || ''}
                    onChange={(e) => setEditingCountry({...editingCountry, flagUrl: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-agreements">Trade Agreements (comma separated)</Label>
                  <Input
                    id="edit-agreements"
                    value={(editingCountry.tradeAgreements || []).join(', ')}
                    onChange={(e) => setEditingCountry({
                      ...editingCountry, 
                      tradeAgreements: e.target.value.split(',').map(s => s.trim())
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tariffs">Special Tariffs (comma separated)</Label>
                  <Input
                    id="edit-tariffs"
                    value={(editingCountry.specialTariffs || []).join(', ')}
                    onChange={(e) => setEditingCountry({
                      ...editingCountry, 
                      specialTariffs: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingCountry.description || ''}
                    onChange={(e) => setEditingCountry({...editingCountry, description: e.target.value})}
                    rows={3}
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
// components/admin/product-form.tsx
"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ApiClient } from "@/lib/utils/api-client";
import type { Product } from "@/types";

// Form schema
const productSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  htsCode: z.string().regex(/^\d{4}\.\d{2}\.\d{4}$/, "Invalid HTS code format. Must be XXXX.XX.XXXX"),
  category: z.string().min(1, "Category is required"),
  baseRate: z.coerce.number().min(0, "Base rate must be a positive number"),
  totalRate: z.coerce.number().min(0, "Total rate must be a positive number"),
  // Additional fields will be handled separately
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product; // For editing, undefined for new product
  onSubmit: (data: ProductFormValues) => Promise<void>;
  categories: string[];
}

export function ProductForm({ product, onSubmit, categories }: ProductFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Set up form with default values
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      name: product.name,
      description: product.description || "",
      htsCode: product.htsCode,
      category: product.category,
      baseRate: product.baseRate,
      totalRate: product.totalRate,
    } : {
      name: "",
      description: "",
      htsCode: "",
      category: "",
      baseRate: 0,
      totalRate: 0,
    },
  });
  
  // Handle form submission
  const handleSubmit = async (data: ProductFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      
      toast({
        title: "Success",
        description: `Product ${product ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error(`Error ${product ? 'updating' : 'creating'} product:`, error);
      toast({
        title: "Error",
        description: `Failed to ${product ? 'update' : 'create'} product`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? "Edit Product" : "Add New Product"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="htsCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTS Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="XXXX.XX.XXXX" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Use format: XXXX.XX.XXXX
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter product description" 
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="baseRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        min="0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="totalRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        min="0" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            <div>
              <h3 className="font-medium mb-2">Additional Fields</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Additional fields like rulings, exclusions, and compliance requirements 
                can be added after creating the base product.
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : (product ? "Update Product" : "Create Product")}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
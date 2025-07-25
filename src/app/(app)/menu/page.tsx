
"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { menuCategories, type MenuItem } from "@/lib/types"
import { addMenuItem, deleteMenuItem, getMenuItems, updateMenuItem } from '@/lib/dataService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const items = await getMenuItems();
      setMenuItems(items);
      setLoading(false);
    };
    fetchItems();
  }, []);

  const handleSaveItem = async (itemData: MenuItem | Omit<MenuItem, 'id'>) => {
    let savedItem: MenuItem | null = null;
    if ('id' in itemData) {
      savedItem = await updateMenuItem(itemData);
      if (savedItem) {
        setMenuItems(prev => prev.map(item => item.id === savedItem!.id ? savedItem! : item));
        toast({ title: "Success", description: "Menu item updated." });
      } else {
        toast({ title: "Error", description: "Failed to update item.", variant: "destructive" });
      }
    } else {
      savedItem = await addMenuItem(itemData);
       if (savedItem) {
        setMenuItems(prev => [...prev, savedItem!]);
        toast({ title: "Success", description: "Menu item added." });
      } else {
        toast({ title: "Error", description: "Failed to add item.", variant: "destructive" });
      }
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    const success = await deleteMenuItem(itemId);
    if (success) {
      setMenuItems(prev => prev.filter(item => item.id !== itemId));
      toast({ title: "Success", description: "Menu item deleted." });
    } else {
       toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
    }
  };
  
  if (loading) {
    return (
        <div className="flex justify-center items-center h-full">
            <p>Loading menu...</p>
        </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="font-headline text-2xl">Menu Management</CardTitle>
          <MenuItemDialog onSave={handleSaveItem}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </MenuItemDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  Image
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={item.name}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={item.imageUrl || 'https://placehold.co/64x64.png'}
                      width="64"
                      data-ai-hint={item.aiHint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                           <MenuItemDialog item={item} onSave={handleSaveItem}>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Edit</DropdownMenuItem>
                          </MenuItemDialog>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function MenuItemDialog({ 
  children, 
  item,
  onSave,
}: { 
  children: React.ReactNode, 
  item?: MenuItem,
  onSave: (item: MenuItem | Omit<MenuItem, 'id'>) => void,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isEditMode = !!item;

  const [name, setName] = useState(item?.name || '');
  const [price, setPrice] = useState(item?.price || 0);
  const [category, setCategory] = useState(item?.category || '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || 'https://placehold.co/300x200.png');


  const handleSubmit = () => {
    const itemData = {
      name,
      price: Number(price),
      category,
      imageUrl,
      aiHint: `${name} food`,
    };
    if (isEditMode) {
      onSave({ id: item.id, ...itemData });
    } else {
      onSave(itemData);
    }
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditMode ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Make changes to the menu item here.' : 'Add a new item to your menu.'} Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">Price</Label>
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {menuCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>{isEditMode ? 'Save changes' : 'Create Item'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

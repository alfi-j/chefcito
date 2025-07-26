-- This script sets up the database schema and initial data for the Chefcito application.
-- To use this file, navigate to the SQL Editor in your Supabase project dashboard,
-- paste the entire content of this file, and click "Run".

-- 1. Create Categories Table
-- Stores the different categories for menu items (e.g., Appetizers, Main Courses).
CREATE TABLE IF NOT EXISTS public.categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL
);

-- 2. Create Menu Items Table
-- Stores the details of each menu item, linked to a category.
CREATE TABLE IF NOT EXISTS public.menu_items (
    id text PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    price numeric(10, 2) NOT NULL,
    category text NOT NULL,
    image_url text,
    ai_hint text
);

-- 3. Create Orders Table
-- Stores order information, including table number and status.
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    table_number integer NOT NULL,
    status text NOT NULL DEFAULT 'pending', -- e.g., 'pending', 'completed'
    created_at timestamptz NOT NULL DEFAULT now(),
    is_pinned boolean DEFAULT false
);

-- 4. Create Order Items Table
-- Links menu items to orders, tracking quantity and cooking status for each item.
CREATE TABLE IF NOT EXISTS public.order_items (
    id text PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id text NOT NULL REFERENCES public.menu_items(id) ON DELETE RESTRICT,
    quantity integer NOT NULL,
    cooked_count integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'New' -- e.g., 'New', 'Cooking', 'Cooked'
);

-- 5. Disable Row Level Security (RLS) for all tables
-- This allows the application to perform read and write operations without
-- requiring a specific user authentication policy for each table.
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;


-- 6. Insert Mock Data
-- Deletes existing data and inserts a fresh set of mock data for testing.

-- Clear existing data
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.menu_items;
DELETE FROM public.categories;

-- Insert categories
INSERT INTO public.categories (name) VALUES
('Appetizers'),
('Main Courses'),
('Desserts'),
('Beverages');

-- Insert menu items
INSERT INTO public.menu_items (id, name, price, category, image_url, ai_hint) VALUES
('item-1', 'Bruschetta', 8.99, 'Appetizers', 'https://placehold.co/300x200.png', 'bruschetta food'),
('item-2', 'Caprese Salad', 10.50, 'Appetizers', 'https://placehold.co/300x200.png', 'caprese salad'),
('item-3', 'Spaghetti Carbonara', 15.99, 'Main Courses', 'https://placehold.co/300x200.png', 'spaghetti carbonara'),
('item-4', 'Margherita Pizza', 13.50, 'Main Courses', 'https://placehold.co/300x200.png', 'margherita pizza'),
('item-5', 'Tiramisu', 7.50, 'Desserts', 'https://placehold.co/300x200.png', 'tiramisu dessert'),
('item-6', 'Panna Cotta', 6.99, 'Desserts', 'https://placehold.co/300x200.png', 'panna cotta'),
('item-7', 'Mineral Water', 2.50, 'Beverages', 'https://placehold.co/300x200.png', 'water bottle'),
('item-8', 'Espresso', 3.00, 'Beverages', 'https://placehold.co/300x200.png', 'espresso coffee');

-- Insert a sample order
-- Create an order first
INSERT INTO public.orders (id, table_number, status, created_at, is_pinned) VALUES
(1, 4, 'pending', NOW() - INTERVAL '15 minutes', false)
ON CONFLICT (id) DO UPDATE SET
  table_number = EXCLUDED.table_number,
  status = EXCLUDED.status,
  created_at = EXCLUDED.created_at,
  is_pinned = EXCLUDED.is_pinned;

-- Insert items for that order
INSERT INTO public.order_items (order_id, menu_item_id, quantity, cooked_count, status) VALUES
(1, 'item-1', 2, 0, 'New'),
(1, 'item-3', 1, 0, 'Cooking'),
(1, 'item-4', 1, 1, 'New');

-- Insert a second sample order
INSERT INTO public.orders (id, table_number, status, created_at, is_pinned) VALUES
(2, 2, 'pending', NOW() - INTERVAL '5 minutes', true)
ON CONFLICT (id) DO UPDATE SET
  table_number = EXCLUDED.table_number,
  status = EXCLUDED.status,
  created_at = EXCLUDED.created_at,
  is_pinned = EXCLUDED.is_pinned;

-- Insert items for the second order
INSERT INTO public.order_items (order_id, menu_item_id, quantity, cooked_count, status) VALUES
(2, 'item-2', 1, 0, 'New'),
(2, 'item-5', 2, 0, 'New');

-- Insert a completed order
INSERT INTO public.orders (id, table_number, status, created_at, is_pinned) VALUES
(3, 8, 'completed', NOW() - INTERVAL '1 hour', false)
ON CONFLICT (id) DO UPDATE SET
  table_number = EXCLUDED.table_number,
  status = EXCLUDED.status,
  created_at = EXCLUDED.created_at,
  is_pinned = EXCLUDED.is_pinned;

-- Insert items for the completed order
INSERT INTO public.order_items (order_id, menu_item_id, quantity, cooked_count, status) VALUES
(3, 'item-7', 2, 2, 'Cooked');

-- Reset sequences to avoid conflicts with new inserts
SELECT setval('public.categories_id_seq', (SELECT MAX(id) FROM public.categories));
SELECT setval('public.orders_id_seq', (SELECT MAX(id) FROM public.orders));

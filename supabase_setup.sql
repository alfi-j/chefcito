-- supabase_setup.sql

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Create Menu Items Table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    price numeric(10, 2) NOT NULL,
    category text NOT NULL,
    image_url text,
    ai_hint text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    table_number integer NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    is_pinned boolean NOT NULL DEFAULT false
);

-- 4. Create Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id bigint NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id uuid NOT NULL REFERENCES public.menu_items(id),
    quantity integer NOT NULL,
    cooked_count integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'New'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. Enable Row Level Security (RLS)
-- It's good practice to enable RLS and define policies.
-- For this starter, we will allow public read access but restrict writes.
-- In a real app, you would have more granular, user-based policies.
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 6. Define RLS Policies
-- Allow public read access to all tables
CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on menu_items" ON public.menu_items FOR SELECT USING (true);
CREATE POLICY "Allow public read access on orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public read access on order_items" ON public.order_items FOR SELECT USING (true);

-- Allow all operations for authenticated users (replace with more specific roles/policies in production)
CREATE POLICY "Allow all operations for authenticated users on categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users on menu_items" ON public.menu_items FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users on orders" ON public.orders FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow all operations for authenticated users on order_items" ON public.order_items FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 7. Populate with initial data
-- Clear existing data before inserting to prevent duplicates on re-runs
TRUNCATE TABLE public.categories, public.menu_items, public.orders, public.order_items RESTART IDENTITY CASCADE;

-- Insert Categories
INSERT INTO public.categories (name) VALUES
('Appetizers'),
('Main Courses'),
('Desserts'),
('Beverages');

-- Insert Menu Items
-- Note: Replace 'your-project-ref' with your actual Supabase project reference if you want to use Supabase storage for images.
-- For now, we'll use placeholder images.
INSERT INTO public.menu_items (name, price, category, image_url, ai_hint) VALUES
('Bruschetta', 8.99, 'Appetizers', 'https://placehold.co/300x200.png', 'bruschetta food'),
('Caprese Salad', 10.50, 'Appetizers', 'https://placehold.co/300x200.png', 'caprese salad'),
('Spaghetti Carbonara', 15.99, 'Main Courses', 'https://placehold.co/300x200.png', 'spaghetti carbonara'),
('Margherita Pizza', 13.50, 'Main Courses', 'https://placehold.co/300x200.png', 'margherita pizza'),
('Grilled Salmon', 22.00, 'Main Courses', 'https://placehold.co/300x200.png', 'grilled salmon'),
('Tiramisu', 7.50, 'Desserts', 'https://placehold.co/300x200.png', 'tiramisu dessert'),
('Panna Cotta', 6.99, 'Desserts', 'https://placehold.co/300x200.png', 'panna cotta'),
('Espresso', 3.00, 'Beverages', 'https://placehold.co/300x200.png', 'espresso coffee'),
('Latte', 4.50, 'Beverages', 'https://placehold.co/300x200.png', 'latte coffee');

-- Example Orders (Optional)
-- This section is commented out by default, but you can run it to have some initial orders in your KDS.
/*
-- Get menu item IDs to use in orders
DO $$
DECLARE
    bruschetta_id uuid;
    caprese_id uuid;
    carbonara_id uuid;
    margherita_id uuid;
    salmon_id uuid;
    tiramisu_id uuid;
    panna_cotta_id uuid;
    espresso_id uuid;
    latte_id uuid;
    order1_id bigint;
    order2_id bigint;
BEGIN
    -- Get menu item UUIDs
    SELECT id INTO bruschetta_id FROM public.menu_items WHERE name = 'Bruschetta';
    SELECT id INTO caprese_id FROM public.menu_items WHERE name = 'Caprese Salad';
    SELECT id INTO carbonara_id FROM public.menu_items WHERE name = 'Spaghetti Carbonara';
    SELECT id INTO margherita_id FROM public.menu_items WHERE name = 'Margherita Pizza';
    SELECT id INTO salmon_id FROM public.menu_items WHERE name = 'Grilled Salmon';
    SELECT id INTO tiramisu_id FROM public.menu_items WHERE name = 'Tiramisu';
    SELECT id INTO panna_cotta_id FROM public.menu_items WHERE name = 'Panna Cotta';
    SELECT id INTO espresso_id FROM public.menu_items WHERE name = 'Espresso';
    SELECT id INTO latte_id FROM public.menu_items WHERE name = 'Latte';

    -- Create Order 1
    INSERT INTO public.orders (table_number, status, is_pinned) VALUES (4, 'pending', true) RETURNING id INTO order1_id;
    INSERT INTO public.order_items (order_id, menu_item_id, quantity, status, cooked_count) VALUES
    (order1_id, carbonara_id, 1, 'Cooking', 0),
    (order1_id, margherita_id, 2, 'New', 0),
    (order1_id, tiramisu_id, 2, 'Cooked', 2),
    (order1_id, bruschetta_id, 3, 'Cooked', 2);


    -- Create Order 2
    INSERT INTO public.orders (table_number, status) VALUES (2, 'completed') RETURNING id INTO order2_id;
    INSERT INTO public.order_items (order_id, menu_item_id, quantity, status, cooked_count) VALUES
    (order2_id, salmon_id, 1, 'Cooked', 1),
    (order2_id, latte_id, 2, 'Cooked', 2);
END $$;
*/

-- End of script

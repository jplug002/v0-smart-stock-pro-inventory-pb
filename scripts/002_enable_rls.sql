-- Enable Row Level Security on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Products: Allow all authenticated users to view and manage
CREATE POLICY "Allow authenticated users to view products"
  ON public.products FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert products"
  ON public.products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update products"
  ON public.products FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete products"
  ON public.products FOR DELETE
  USING (auth.role() = 'authenticated');

-- Suppliers: Allow all authenticated users to view and manage
CREATE POLICY "Allow authenticated users to view suppliers"
  ON public.suppliers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert suppliers"
  ON public.suppliers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update suppliers"
  ON public.suppliers FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete suppliers"
  ON public.suppliers FOR DELETE
  USING (auth.role() = 'authenticated');

-- Sales: Allow all authenticated users to view and manage
CREATE POLICY "Allow authenticated users to view sales"
  ON public.sales FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert sales"
  ON public.sales FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update sales"
  ON public.sales FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete sales"
  ON public.sales FOR DELETE
  USING (auth.role() = 'authenticated');

-- Expenses: Allow all authenticated users to view and manage
CREATE POLICY "Allow authenticated users to view expenses"
  ON public.expenses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update expenses"
  ON public.expenses FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete expenses"
  ON public.expenses FOR DELETE
  USING (auth.role() = 'authenticated');

-- Notifications: Allow all authenticated users to view and manage
CREATE POLICY "Allow authenticated users to view notifications"
  ON public.notifications FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update notifications"
  ON public.notifications FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete notifications"
  ON public.notifications FOR DELETE
  USING (auth.role() = 'authenticated');

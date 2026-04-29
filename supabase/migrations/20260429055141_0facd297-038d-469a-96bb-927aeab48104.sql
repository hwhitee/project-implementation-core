-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.alert_type AS ENUM ('yellow', 'red', 'women');
CREATE TYPE public.alert_status AS ENUM ('pending', 'confirmed', 'received');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role function (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ALERTS
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type public.alert_type NOT NULL,
  caption TEXT,
  image_url TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  status public.alert_status NOT NULL DEFAULT 'pending',
  ai_verified BOOLEAN,
  ai_category TEXT,
  ai_description TEXT,
  ai_confidence NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_alerts_user ON public.alerts(user_id);
CREATE INDEX idx_alerts_type_status ON public.alerts(type, status);

-- SOLUTIONS
CREATE TABLE public.alert_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  solution TEXT NOT NULL,
  safety_measure TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alert_solutions ENABLE ROW LEVEL SECURITY;

-- SAFETY MEASURES (general, published by admins)
CREATE TABLE public.safety_measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.safety_measures ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read);

-- RLS POLICIES

-- profiles: each user manages own; admins read all
CREATE POLICY "Profiles viewable by self" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles update self" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles insert self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles: user can read own, admins read all; only admins can insert/delete
CREATE POLICY "Roles read self" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Roles admin manage" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- alerts
CREATE POLICY "Alerts insert own" ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Alerts select own or admin" ON public.alerts FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Alerts update admin" ON public.alerts FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Alerts delete own or admin" ON public.alerts FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- solutions: admins manage; alert owner can read
CREATE POLICY "Solutions admin insert" ON public.alert_solutions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Solutions read by owner or admin" ON public.alert_solutions FOR SELECT USING (
  public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.alerts a WHERE a.id = alert_id AND a.user_id = auth.uid())
);
CREATE POLICY "Solutions admin update" ON public.alert_solutions FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- safety_measures: everyone authenticated reads; admins write
CREATE POLICY "Safety read all" ON public.safety_measures FOR SELECT TO authenticated USING (true);
CREATE POLICY "Safety admin manage" ON public.safety_measures FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- notifications
CREATE POLICY "Notif read own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Notif update own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Notif admin insert" ON public.notifications FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  -- Default role: user
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER alerts_touch BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- STORAGE bucket for alert images (public read)
INSERT INTO storage.buckets (id, name, public) VALUES ('alert-images', 'alert-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Alert images public read" ON storage.objects FOR SELECT USING (bucket_id = 'alert-images');
CREATE POLICY "Alert images authenticated upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'alert-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Alert images own update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'alert-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Alert images own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'alert-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Seed safety measures
INSERT INTO public.safety_measures (title, content, category) VALUES
('Flood Safety', 'Move to higher ground immediately. Avoid walking or driving through flood waters. 6 inches of moving water can knock you down.', 'flood'),
('Earthquake Drop-Cover-Hold', 'Drop to your hands and knees, take cover under sturdy furniture, hold on until shaking stops.', 'earthquake'),
('Fire Evacuation', 'Crawl low under smoke. Feel doors before opening. Use stairs, never elevators. Meet at designated assembly point.', 'fire'),
('Cyclone Preparedness', 'Stock up on water, food, batteries. Stay indoors and away from windows. Listen to NDMA bulletins.', 'cyclone');

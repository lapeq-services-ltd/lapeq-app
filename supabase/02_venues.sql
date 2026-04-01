-- Create venues/partners table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS venues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Lagos',
    address TEXT,
    lat DECIMAL(10, 7),
    lng DECIMAL(10, 7),
    description TEXT,
    image_url TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active venues" ON venues FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage venues" ON venues FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed data
INSERT INTO venues (name, category, city, address, lat, lng) VALUES

-- RESTAURANTS (Lagos)
('Gusto', 'restaurant', 'Lagos', '256 Etim Iyang Crescent, Victoria Island', 6.4281, 3.4219),
('Cilantro', 'restaurant', 'Lagos', 'Victoria Island, Lagos', 6.4310, 3.4185),
('Cilantro', 'restaurant', 'Lagos', 'Ikeja, Lagos', 6.5800, 3.3500),
('Kapadoccia', 'restaurant', 'Lagos', '22 Idowu Taylor Street, Victoria Island', 6.4295, 3.4172),
('Breeze', 'restaurant', 'Lagos', 'Eko Hotel & Suites, Victoria Island', 6.4350, 3.4230),
('Nola', 'restaurant', 'Lagos', 'Victoria Island, Lagos', 6.4300, 3.4200),
('IIV Bistro', 'restaurant', 'Lagos', 'Victoria Island, Lagos', 6.4315, 3.4190),
('Picole', 'restaurant', 'Lagos', 'Lekki, Lagos', 6.4450, 3.4700),
('Cane and Lemon', 'restaurant', 'Lagos', 'Victoria Island, Lagos', 6.4290, 3.4175),
('Rodo Restaurant', 'restaurant', 'Lagos', 'Lekki Phase 1, Lagos', 6.4460, 3.4720),
('Uncle Tee', 'restaurant', 'Lagos', 'Victoria Island, Lagos', 6.4305, 3.4195),
('Blue Cubana', 'restaurant', 'Lagos', '17 Adeola Odeku Street, Victoria Island', 6.4320, 3.4205),

-- RESTAURANTS (Abuja)
('Gusto', 'restaurant', 'Abuja', 'Abuja', 9.0600, 7.4900),
('Cilantro', 'restaurant', 'Abuja', 'Abuja', 9.0720, 7.4880),
('Kapadoccia', 'restaurant', 'Abuja', 'Wuse 2, Abuja', 9.0730, 7.4905),
('Charcoal Grill', 'restaurant', 'Abuja', 'Wuse 2, Abuja', 9.0740, 7.4900),
('OSO Restaurant', 'restaurant', 'Abuja', 'Wuse, Abuja', 9.0720, 7.4880),
('Zuma Grill', 'restaurant', 'Abuja', 'Transcorp Hilton, Abuja', 9.0550, 7.4890),

-- LOUNGES (Lagos)
('Rhapsody''s', 'lounge', 'Lagos', '38 Isaac John Street, GRA Ikeja', 6.5800, 3.3600),
('Barracuda', 'lounge', 'Lagos', 'Okun Ajah Road, Ajah', 6.4680, 3.5800),
('Vanilla Lounge', 'lounge', 'Lagos', '2a Saka Jojo Street, Victoria Island', 6.4285, 3.4180),
('11:11', 'lounge', 'Port Harcourt', 'Port Harcourt', 4.8156, 7.0498),
('Baryucca Lounge', 'lounge', 'Lagos', 'Victoria Island, Lagos', 6.4300, 3.4210),
('Lupita Lounge', 'lounge', 'Lagos', 'Lekki Phase 1, Lagos', 6.4455, 3.4710),
('Boom Boom Lounge', 'lounge', 'Lagos', 'Victoria Island, Lagos', 6.4330, 3.4225),
('Madagascar', 'lounge', 'Lagos', 'Lekki, Lagos', 6.4480, 3.4760),
('Check Point', 'lounge', 'Lagos', 'Victoria Island, Lagos', 6.4295, 3.4188),
('Papi', 'lounge', 'Lagos', 'Lekki Phase 1, Lagos', 6.4440, 3.4690),
('Pickle Lounge', 'lounge', 'Lagos', 'Victoria Island, Lagos', 6.4288, 3.4177),
('Blakes', 'lounge', 'Lagos', 'Ikoyi, Lagos', 6.4500, 3.4350),

-- LOUNGES (Abuja)
('Cue-Bar Lounge', 'lounge', 'Abuja', '2 Lobito Crescent, Wuse 2, Abuja', 9.0730, 7.4910),

-- CLUBS (Lagos)
('Boom Boom', 'club', 'Lagos', 'Victoria Island, Lagos', 6.4335, 3.4228),
('Play', 'club', 'Lagos', '273A Ajose Adeogun Street, Victoria Island', 6.4275, 3.4165),
('345', 'club', 'Lagos', 'Victoria Island, Lagos', 6.4340, 3.4232),
('Maggie City', 'club', 'Lagos', 'Lekki, Lagos', 6.4490, 3.4770),
('Sequence', 'club', 'Lagos', 'Victoria Island, Lagos', 6.4345, 3.4235),

-- HOTELS & APARTMENTS (Lagos)
('Time Oak Hotel & Suites', 'hotel', 'Lagos', '12 Nike Art Gallery Road, Lekki Phase 1', 6.4520, 3.4780),
('Villa Picasso', 'hotel', 'Lagos', '62A Ademola Adetokunbo, Victoria Island', 6.4360, 3.4240),
('Lagos Continental Hotel', 'hotel', 'Lagos', 'Victoria Island, Lagos', 6.4370, 3.4245),
('Esylum', 'hotel', 'Lagos', 'Lekki Phase 1, Lagos', 6.4510, 3.4775),
('Clay House', 'hotel', 'Lagos', 'Lekki, Lagos', 6.4495, 3.4772),
('Living Room Apartment', 'hotel', 'Lagos', 'Victoria Island, Lagos', 6.4308, 3.4198),
('Freizers Suites', 'hotel', 'Lagos', 'Lekki, Lagos', 6.4485, 3.4765),
('Nodie Hotel', 'hotel', 'Lagos', 'Lagos', 6.4400, 3.4300),

-- HOTELS (Abuja)
('Envoy Hotel', 'hotel', 'Abuja', '305 Diplomatic Drive, CBD, Abuja', 9.0480, 7.4920),
('Prosbel Hotel', 'hotel', 'Abuja', '6 Beira Crescent, Wuse 2, Abuja', 9.0750, 7.4920),

-- SPA & WELLNESS
('Kwin-Bee Beauty', 'spa', 'Abuja', 'Wuse, Abuja', 9.0715, 7.4875),
('Vicara Spa', 'spa', 'Lagos', 'Victoria Island, Lagos', 6.4318, 3.4202);

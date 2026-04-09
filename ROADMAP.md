# Lapeq App Roadmap
## Features from Website to Add to App

---

## PHASE 1 — Before Demo (Quick wins, 1-2 days)

### 1. Free Tier in Membership Screen
- Add Free (₦0) tier card to `app/services/tier-purchase.tsx`
- Perks: Physical LAPEQ card, partner discounts, Monthly Picks access, Journal content
- Button says "Get Started" not "Request Upgrade"

### 2. FAQ Screen
- New screen `app/(main)/faq.tsx`
- 5 questions from website:
  - What exactly does a LAPEQ concierge do?
  - How does LAPEQ handle my privacy?
  - What is Project Supervision and who is it for?
  - Which membership tier should I start with?
  - Can LAPEQ assist me if I live outside Nigeria?
- Accordion expand/collapse per question
- Link from Profile or Settings

### 3. Monthly Picks Section
- Add "LAPEQ Recommends" section to home screen (below Curated For You)
- Pulls from a `picks` table in Supabase (admin can update monthly)
- Card shows: venue name, category tag, short description
- Taps through to venue detail

---

## PHASE 2 — Short Term (1-2 weeks)

### 4. Ladies Concierge Section
- New screen `app/explore/ladies-concierge.tsx`
- Services listed:
  - Personal styling & fashion access
  - Salon & spa bookings (same-day, priority Gold/Black)
  - Social event management & wardrobe coordination
  - Safe executive transport for solo travel
  - Household & personal arrangements
- "Enquire Now" button → pre-fills concierge request form

### 5. Gentlemen's Experience Section
- New screen `app/explore/gentlemen.tsx`
- Services listed:
  - Executive car hire 24/7
  - Priority restaurant & lounge reservations
  - Bespoke event planning & corporate dinners
  - Sports & recreation access (golf, gym, VIP tickets)
  - Personal shopping & wardrobe consultancy
- "Enquire Now" button → pre-fills concierge request form

### 6. Journal / Lifestyle Content
- New tab or section `app/journal/`
- Articles from Supabase `journal` table (admin posts from dashboard)
- List view: cover image, title, category, read time
- Full article view with rich text
- Categories: Lifestyle, Travel, Dining, Wellness, Business

### 7. Executive Networking Transit
- Add as a service type in `app/services/`
- Member fills: travel route (e.g. Lagos → Abuja), travel date, industry/profession
- Admin matches them with another member on same route
- Shows as a Gold/Black exclusive feature

### 8. Investment Advisorship
- Add as a Black-tier-only service
- Member fills: investment interest, capital range, sector
- Admin connects them with vetted advisors
- Gate it: if user tier is not Black, show "Black Tier Exclusive" lock screen

---

## PHASE 3 — Medium Term (1 month)

### 9. Project Supervision Reports In-App
- Members with active Project Supervision see a "My Project" section in profile
- Weekly Friday reports: photos, drone footage thumbnails, plain-English summary
- Admin uploads reports from dashboard
- Push notification every Friday when new report is available

### 10. Experience Reel / Video Section
- Short video section on home or explore screen
- "The LAPEQ Experience" 60-second reel
- Hosted on Supabase Storage or YouTube embed

### 11. Curated Venues — Full Filter
- Website has: All / Restaurants / Lounges / Cafés / Spas & Wellness
- App explore already has categories but should match website exactly
- Add Cafés as a category

### 12. How It Works Screen
- 4-step explainer from website:
  1. Reach Out
  2. We Listen
  3. We Arrange
  4. You Experience
- Show on onboarding or as a screen in (main)

### 13. Testimonials / Client Voices
- Section on home or profile showing member quotes
- Pull from Supabase `testimonials` table
- Admin can add/edit from dashboard

---

## PHASE 4 — Later

### 14. Paystack Integration
- Membership payments in-app (Free → Silver → Gold → Black)
- Service charge payments from invoices

### 15. KYC Verification
- ID upload for new members
- Admin reviews and approves
- Unlocks full service access

### 16. Corporate / B2B Section
- Separate onboarding flow for corporate clients
- Company name, industry, number of employees
- Links to Corporate Pairing service

### 17. Referral System
- Members get a referral code
- Track referrals in profile
- Rewards for successful referrals (discount, tier upgrade)

### 18. Driver Tracking (Live Map)
- Requires EAS development build (not Expo Go)
- Real-time driver location on map
- Member sees driver moving toward them
- ETA countdown

### 19. Interactive Venue Maps
- Replace static Mapbox image with interactive map
- Also requires EAS development build

---

## SQL Needed for New Features

```sql
-- Monthly Picks
create table if not exists picks (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references venues(id),
  title text,
  description text,
  month text, -- e.g. "April 2026"
  active boolean default true,
  created_at timestamptz default now()
);

-- Journal articles
create table if not exists journal (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  category text,
  cover_url text,
  content text,
  read_time int,
  published boolean default false,
  created_at timestamptz default now()
);

-- Testimonials
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text,
  role text,
  city text,
  tier text,
  quote text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Project reports
create table if not exists project_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text,
  summary text,
  photos jsonb default '[]',
  week_of date,
  created_at timestamptz default now()
);
```

---

## Summary Table

| Feature | Priority | Effort | Status |
|---------|----------|--------|--------|
| Free tier in membership | HIGH | Small | Not started |
| FAQ screen | HIGH | Small | Not started |
| Monthly Picks | HIGH | Medium | Not started |
| Ladies Concierge | HIGH | Medium | Not started |
| Gentlemen's Experience | HIGH | Medium | Not started |
| Journal | MEDIUM | Large | Not started |
| Executive Networking Transit | MEDIUM | Medium | Not started |
| Investment Advisorship | MEDIUM | Medium | Not started |
| Project Supervision reports | MEDIUM | Large | Not started |
| Experience Reel | LOW | Small | Not started |
| How It Works screen | LOW | Small | Not started |
| Testimonials | LOW | Small | Not started |
| Paystack | LOW | Large | Not started |
| KYC | LOW | Large | Not started |
| Corporate section | LOW | Large | Not started |
| Referral system | LOW | Large | Not started |
| Live driver tracking | LOW | Large | Not started |
| Interactive maps | LOW | Large | Not started |

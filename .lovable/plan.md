
# Service LLD — Public Site + Admin Dashboard

A modern car rental site for Meknes with a full admin dashboard, all powered by Lovable Cloud (auth + database + storage). No external NestJS server needed - the same data drives both the public site and the admin.

## 1. Public Website (FR + touches d'arabe)

**Design**: black / white / WhatsApp green (#25D366), generous whitespace, rounded cards with soft shadows, clean sans-serif. Mobile-first, fully responsive.

### Sections (single-page, smooth scroll)
- **Navbar**: "Service LLD" logo (left) · Accueil · Voitures · Pourquoi nous · Contact · WhatsApp CTA (right). Mobile burger menu.
- **Hero**:
  - Title: "Location premium de voitures a Meknes"
  - Subtitle: "Louez votre voiture بسهولة وبأفضل الأسعار"
  - Primary button: "Réserver via WhatsApp" → opens `wa.me/212665253565` with a prefilled message
  - Background: stylish car image with dark overlay
- **Voitures**: grid of cars pulled live from the database. Each card shows image, name, "XXX DH / jour", and "Réserver" button (opens WhatsApp prefilled with the car name). Seeded with Dacia Logan (250 DH), Clio 4 (300 DH), Hyundai i10 (200 DH).
- **Pourquoi nous choisir**: 3 icon cards — Prix compétitifs · Service rapide · Disponible 24/7.
- **Contact**:
  - Phone: +212 665-253565 (click-to-call)
  - WhatsApp button
  - Embedded Google Maps iframe centered on VC98+6G Meknes
- **Footer**: Service LLD · phone · copyright · small "مرحبا بكم" tag.
- **Floating WhatsApp button** (bottom-right, fixed, pulse animation).

## 2. Admin Dashboard

Protected area at `/admin/*`. Email + password login via Lovable Cloud auth, restricted to users with the `admin` role (stored in a separate `user_roles` table for security).

### Layout
Sidebar (Dashboard · Voitures · Réservations) + topbar with logout.

### Pages
- **/admin/login** — email + password form, redirects to dashboard on success.
- **/admin/dashboard** — stat cards (Total voitures · Total réservations · Revenu total) + table of 5 latest bookings + a simple bar chart of bookings per day (last 7 days).
- **/admin/cars** — table/grid of all cars with image preview. Add / Edit / Delete via modal. Image upload to Lovable Cloud storage with live preview.
- **/admin/bookings** — table of all bookings (client, phone, dates, car, total price). Delete action. Filter by date range and search by name/phone.

### UX polish
- Toast notifications for all actions
- Loading skeletons + empty states
- Confirmation dialogs on delete
- Fully responsive

## 3. Data Model (Lovable Cloud)

- `cars` — id, name, price_per_day, image_url, created_at
- `bookings` — id, car_id (FK), customer_name, phone, start_date, end_date, total_price (auto = days × price), created_at
- `user_roles` — id, user_id (FK auth.users), role (`admin` | `user`)
- Storage bucket `car-images` (public read, admin write)
- RLS:
  - `cars`: public SELECT; INSERT/UPDATE/DELETE only for admins
  - `bookings`: public INSERT (so the public site can create bookings later if needed); SELECT/DELETE only for admins
  - `user_roles`: read via security-definer `has_role()` function
- Seed: 3 cars listed above + first signed-up admin user gets `admin` role manually (I'll provide instructions).

## 4. Tech Notes

- React + Vite + Tailwind + shadcn/ui (already in project)
- React Router for `/` and `/admin/*` routes; `ProtectedRoute` wrapper checks session + admin role
- TanStack Query for all data fetching
- Lovable Cloud client (`@/integrations/supabase/client`) replaces axios; no `localhost:3000` dependency
- WhatsApp links use `https://wa.me/212665253565?text=...`

## 5. Out of Scope (can add later)
- Public-facing booking form that writes to DB (currently bookings come via WhatsApp; admin can also create them manually if you want — say the word)
- Multi-language toggle
- Email notifications on new bookings

After approval I'll build it end-to-end in one pass.

# Fashion E-Commerce Platform Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based (Modern Fashion E-Commerce)

Drawing inspiration from contemporary fashion retailers like Zara, ASOS, Reformation, and premium Shopify stores that balance visual storytelling with conversion-focused design. The aesthetic prioritizes product photography, clean typography, and spacious layouts that let fashion items breathe.

**Key Design Principles:**
- Photography-first: Products are heroes, UI recedes
- Editorial quality: Magazine-like presentation with generous whitespace
- Conversion-optimized: Clear CTAs without compromising aesthetics
- Trust signals: Professional presentation builds credibility

---

## Core Design Elements

### A. Typography

**Font Families:**
- Primary (Headings): "Inter" or "DM Sans" (Google Fonts) - 600, 700 weights
- Secondary (Body): "Inter" or "Open Sans" - 400, 500 weights
- Accent (Optional pricing/labels): Tabular numbers, monospace feel

**Type Scale:**
- Hero Headlines: text-5xl md:text-6xl lg:text-7xl (large product launches)
- Page Titles: text-3xl md:text-4xl lg:text-5xl
- Section Headers: text-2xl md:text-3xl
- Product Titles: text-lg md:text-xl (medium weight)
- Body Text: text-base (regular weight)
- Metadata/Labels: text-sm uppercase tracking-wide
- Captions/Helper: text-xs

**Hierarchy Rules:**
- Product names always medium weight (500-600)
- Prices slightly larger than product names, bold weight
- Category labels uppercase with letter-spacing
- Admin dashboard uses consistent text-base with bold headers

---

### B. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24

**Common Patterns:**
- Section padding: py-16 md:py-24 (generous vertical rhythm)
- Component gaps: gap-4 to gap-8
- Card padding: p-4 to p-6
- Grid gutters: gap-6 md:gap-8
- Container constraints: max-w-7xl mx-auto px-4 md:px-6

**Grid Systems:**
- Product grids: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 (homepage/category)
- Featured products: grid-cols-1 md:grid-cols-2 (larger cards with details)
- Admin dashboard: Single column forms with occasional 2-column splits
- Category navigation: grid-cols-2 md:grid-cols-4 lg:grid-cols-6

**Responsive Breakpoints:**
- Mobile-first approach
- Major adjustments at md (768px) and lg (1024px)
- Product images always maintain aspect ratio (3:4 portrait)

---

### C. Component Library

#### Navigation & Header
- **Main Navigation:** Sticky header with logo (left), category links (center), icons for search/cart/account (right)
- **Mobile:** Hamburger menu revealing full-screen overlay navigation
- **Category Menu:** Horizontal scroll on mobile, full width on desktop with hover dropdowns showing subcategories
- **Search:** Overlay modal with real-time suggestions, recent searches, and trending items

#### Product Components
- **Product Card:** Clean card with product image (hover shows second image), product name, price, quick-add button on hover (desktop)
- **Product Gallery:** Main large image with thumbnail strip below, click to expand lightbox view
- **Product Details:** Two-column layout (gallery left, info right) on desktop, stacked on mobile
- **Size Selector:** Button group with outlined states, selected state filled
- **Add to Cart:** Large, prominent button with quantity selector inline
- **Product Badges:** "New Arrival", "Sale", "Low Stock" positioned on top-left of product images

#### Shopping Experience
- **Cart Drawer:** Slide-in panel from right with product thumbnails, quantities, subtotal, and checkout CTA
- **Cart Summary:** Sticky summary card on checkout showing order breakdown
- **Checkout Form:** Multi-step with progress indicator (Address → Payment → Review)
- **Empty States:** Centered icon, message, and CTA for empty cart, no orders, etc.

#### Admin Dashboard
- **Sidebar Navigation:** Fixed left sidebar with icon + label navigation (Products, Orders, Categories, Settings)
- **Data Tables:** Clean tables with alternating row backgrounds, sortable headers, action buttons (edit/delete) in last column
- **Product Form:** Single-column form with clear sections (Basic Info, Pricing, Images, Inventory)
- **Image Upload:** Drag-and-drop zone with preview grid of uploaded images
- **Bulk Actions:** Checkbox selection with floating action bar
- **Stats Cards:** Dashboard overview with key metrics in 4-column grid

#### Forms & Inputs
- **Text Inputs:** Outlined style with floating labels, focus states with subtle shadow
- **Select Dropdowns:** Custom styled to match input aesthetic
- **Checkboxes/Radio:** Custom styled with smooth transitions
- **Buttons Primary:** Solid background, full width on mobile, auto width on desktop
- **Buttons Secondary:** Outlined style for less emphasis
- **Error States:** Red border with error message below field

#### Content Sections
- **Category Landing:** Full-width hero image with overlay text and CTA, followed by product grid
- **Homepage Sections:** Mix of full-width editorial images, featured collections (2-3 column), and promotional banners
- **Footer:** Three-column layout (About/Links, Customer Service, Newsletter signup) with social icons row

---

### D. Visual Treatment

**Borders & Shadows:**
- Cards: border or subtle shadow (shadow-sm), never both
- Buttons: No shadows, use solid fills and borders
- Modals/Drawers: shadow-xl for elevation
- Product images: No borders, let image edges breathe

**Interactions:**
- Hover states: Subtle scale (scale-105) on product images
- Button hovers: Slight opacity change or darker shade
- Transitions: transition-all duration-200 for smoothness
- Loading states: Skeleton screens matching content layout

**Spacing Philosophy:**
- Generous whitespace around product images
- Tight grouping of related information (price + name)
- Clear separation between sections (py-16 minimum)

---

## Images

### Required Images & Placement

**Hero Section (Homepage):**
- Large hero image: Full-width lifestyle shot featuring models wearing products in natural setting
- Dimensions: 1920x800px minimum, 16:9 aspect ratio
- Overlay: Dark gradient (bottom to top) for text readability
- Text overlay: Large headline (e.g., "New Season Essentials") + CTA button with blurred background backdrop

**Product Images:**
- Primary product photos: Clean white/neutral background, 3:4 portrait ratio (1200x1600px)
- Lifestyle shots: Models wearing products in context for product detail pages
- Hover images: Alternative angle or styled shot for product cards

**Category Banners:**
- Category landing pages: Full-width editorial image (1920x600px) showing category vibe
- Collection highlights: 2-3 medium images (800x1000px) in grid for homepage featured sections

**Editorial Content:**
- Seasonal lookbook: Large format images (1200x1500px) in scrolling gallery
- About/Brand story: Authentic behind-the-scenes photography

**Admin Panel:**
- Product upload previews: Thumbnails at 150x200px
- Placeholder images: Use abstract patterns or brand logo for missing images

**Image Treatment:**
- Never crop product images awkwardly - maintain aspect ratios
- Subtle fade-in on load
- Lazy loading for performance
- Lightbox/zoom functionality on product detail pages

---

## Accessibility & Performance

- Maintain WCAG AA contrast ratios for all text
- Focus states: visible outline (ring-2 ring-offset-2) on all interactive elements
- Alt text for all product images with descriptive names
- Keyboard navigation throughout
- Loading states for all async operations
- Optimized images: WebP format with JPG fallbacks, responsive srcset

---

## Admin Panel Specific

**Dashboard Aesthetic:**
- More utilitarian than customer-facing, but still polished
- Data density balanced with readability
- Clear visual hierarchy in tables and forms
- Consistent spacing and alignment
- Status indicators: Use subtle colored badges (green=active, yellow=pending, red=cancelled)
- Action buttons grouped logically (Edit/Delete together)
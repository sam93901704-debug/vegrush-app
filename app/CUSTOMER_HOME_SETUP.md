# Customer Home Page - Premium UI Setup

This document describes the premium UI improvements made to the customer home page.

## New Features

### 1. Hero Section with Animated Gradient Text
- Beautiful hero section with "Fresh Vegetables Delivered Fast" message
- Animated gradient text effect
- Responsive design with decorative background elements

### 2. Category Row with Icons
- Visual category chips with icons for Vegetables, Fruits, Greens
- Smooth hover and selection animations
- Default categories shown if none are available

### 3. Search Bar with 300ms Debounce
- Updated debounce delay to 300ms (previously 500ms)
- Premium styling with improved focus states
- Better placeholder text

### 4. Product Grid with Framer Motion Animations
- Staggered fade and scale-in animations for products
- Smooth hover effects with lift animation
- Professional transitions

### 5. Enhanced Cart Button
- Sticky bottom cart button showing:
  - Total items count badge
  - Total cart amount (₹XXX)
  - "View Cart" label
- Only appears when cart has items
- Gradient green styling matching the theme

### 6. Improved Skeleton Loaders
- Enhanced skeleton cards (4-6 cards shown)
- Better visual hierarchy
- Smooth pulse animation

### 7. Pull-to-Refresh Support
- Mobile-friendly pull-to-refresh functionality
- Visual indicator when refreshing
- Smooth animations

### 8. Premium Styling
- Responsive spacing and typography
- Modern rounded corners (rounded-2xl, rounded-3xl)
- Gradient backgrounds
- Improved shadows and hover effects
- Better color scheme (green/emerald theme)

## Installation

### Install Framer Motion

```bash
cd app
npm install framer-motion
```

Or with yarn:

```bash
cd app
yarn add framer-motion
```

## Components Created

### 1. `HeroSection.tsx`
- Premium hero section component
- Animated gradient text
- Responsive layout

### 2. `CategoryChip.tsx`
- Reusable category chip component
- Icon support
- Selection states with animations

### 3. `usePullToRefresh.ts` (Hook)
- Custom hook for pull-to-refresh functionality
- Mobile-optimized
- Configurable threshold and resistance

### 4. Updated Components

- **`page.tsx`**: Main customer home page with all new features
- **`ProductCard.tsx`**: Enhanced with Framer Motion animations
- **`CartButton.tsx`**: Updated to show total items + amount
- **`ProductCardSkeleton.tsx`**: Enhanced skeleton loader

## Styling Improvements

### Color Scheme
- Primary: Green/Emerald gradient (`from-green-600 to-emerald-600`)
- Background: Gradient from gray-50 to white
- Accents: Green-themed throughout

### Typography
- Hero: 4xl-6xl font size, bold
- Product names: Large, bold, hover effects
- Prices: 2xl, bold

### Spacing
- Container: px-4, py-6
- Cards: gap-6, rounded-2xl
- Padding: p-5 (product cards), p-4 (general)

### Animations
- Staggered product grid animations (0.1s delay between items)
- Fade and scale-in effects
- Smooth hover transitions (300ms)
- Pull-to-refresh with visual feedback

## Usage

The page automatically includes all features. Just ensure:

1. **Framer Motion is installed** (see Installation above)
2. **Backend is running** on `http://localhost:4000`
3. **Cart context is available** (should be in layout)

## Customization

### Change Debounce Delay
In `app/customer/page.tsx`, modify:
```typescript
const debouncedSearch = useDebounce(searchQuery, 300); // Change 300 to your desired delay
```

### Change Category Icons
In `app/customer/page.tsx`, modify the `CATEGORY_ICONS` object:
```typescript
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Vegetables': <YourIcon />,
  // ...
};
```

### Adjust Pull-to-Refresh
In `app/customer/page.tsx`, modify:
```typescript
const { isRefreshing, pullDistance } = usePullToRefresh({
  onRefresh: async () => { /* ... */ },
  enabled: true,
  threshold: 80, // Distance in pixels
  resistance: 0.5, // Resistance factor (0-1)
});
```

### Change Animation Speed
In `app/customer/page.tsx`, modify:
```typescript
const containerVariants = {
  // ...
  visible: {
    // ...
    transition: {
      staggerChildren: 0.1, // Delay between items
    },
  },
};

const itemVariants = {
  // ...
  visible: {
    // ...
    transition: {
      duration: 0.4, // Animation duration
      ease: 'easeOut',
    },
  },
};
```

## Troubleshooting

### Framer Motion Not Found
If you see errors about Framer Motion:
```bash
cd app
npm install framer-motion
```

### Animations Not Working
- Ensure Framer Motion is installed
- Check browser console for errors
- Verify the component is wrapped with `'use client'` directive

### Pull-to-Refresh Not Working
- Only works on mobile devices with touch support
- Ensure you're at the top of the page (scrollY === 0)
- Check browser console for errors

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Pull-to-refresh works best on mobile devices


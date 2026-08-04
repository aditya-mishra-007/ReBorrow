import {
  Wrench,
  Cpu,
  Dumbbell,
  BookOpen,
  ChefHat,
  Sofa,
  Car,
  Tent,
  Gamepad2,
  Shirt,
  Baby,
  PawPrint,
  Package,
  type LucideIcon,
} from 'lucide-react';

/**
 * categories.ts
 * ------------------------------------------------------------------
 * Canonical, icon-mapped list of asset categories. This is a
 * FRONTEND-ONLY presentational concept — the backend's Asset.category
 * field remains a free-form String with no schema-level enum (see
 * Asset.ts), so a listing created before this feature existed, or via
 * a direct API call, can still hold any arbitrary category string.
 *
 * `getCategoryIcon()` handles that gracefully: any category not found
 * in this list falls back to a generic Package icon rather than
 * crashing or rendering nothing.
 */

export interface CategoryOption {
  label: string;
  value: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryOption[] = [
  { label: 'Tools', value: 'Tools', icon: Wrench },
  { label: 'Electronics', value: 'Electronics', icon: Cpu },
  { label: 'Sports & Outdoors', value: 'Sports & Outdoors', icon: Dumbbell },
  { label: 'Books', value: 'Books', icon: BookOpen },
  { label: 'Kitchen & Appliances', value: 'Kitchen & Appliances', icon: ChefHat },
  { label: 'Furniture', value: 'Furniture', icon: Sofa },
  { label: 'Vehicles', value: 'Vehicles', icon: Car },
  { label: 'Camping & Travel', value: 'Camping & Travel', icon: Tent },
  { label: 'Games & Toys', value: 'Games & Toys', icon: Gamepad2 },
  { label: 'Clothing & Accessories', value: 'Clothing & Accessories', icon: Shirt },
  { label: 'Baby & Kids', value: 'Baby & Kids', icon: Baby },
  { label: 'Pet Supplies', value: 'Pet Supplies', icon: PawPrint },
  { label: 'Other', value: 'Other', icon: Package },
];

/**
 * DEFAULT_CATEGORY_ICON
 * ------------------------------------------------------------------
 * Fallback for any category string that doesn't match the canonical
 * list above (e.g., legacy free-text data from before this feature).
 */
export const DEFAULT_CATEGORY_ICON: LucideIcon = Package;

/**
 * getCategoryIcon
 * ------------------------------------------------------------------
 * Case-insensitive lookup — resolves a raw category string (as stored
 * on an Asset document) to its matching icon component, or the
 * generic fallback if no match is found.
 */
export function getCategoryIcon(category: string): LucideIcon {
  const match = CATEGORIES.find((c) => c.value.toLowerCase() === category.toLowerCase());
  return match ? match.icon : DEFAULT_CATEGORY_ICON;
}
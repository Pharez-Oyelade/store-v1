/*
TYPESCRIPT TYPES AND INTERFACES
*/


export enum OrderStatus {
  Pending = "pending",
  Confirmed = "confirmed",
  Ready = "ready",
  Dispatched = "dispatched",
  Completed = "completed",
  Cancelled = "cancelled",
}

export enum ProductStatus {
  Active = "active",
  Draft = "draft",
  Archived = "archived",
  SoldOut = "sold_out",
}

export enum SubscriptionPlan {
  Starter = "starter",
  Growth = "growth",
  Pro = "pro",
}

export enum SubscriptionStatus {
  Active = "active",
  Inactive = "inactive",
  PastDue = "past_due",
}

export enum OrderSource {
  DM = "dm",
  Call = "call",
  WalkIn = "walk_in",
  Storefront = "storefront",
}

//  Cloudinary Image
export interface CloudinaryImage {
  url: string;
  publicId: string;
}

// product variant
export interface ProductVariant {
  _id?: string; // optional for new variants that haven't been saved yet
  label: string; // e.g., "Small", "Medium", "Large"
  price: number;
  size?: string;
  color?: string;
  custom?: string; // for any additional variant-specific info
  sku?: string; // optional SKU for inventory tracking
  quantity: number;
  sold: number;
}

export interface Product {
  _id: string;
  vendor: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  images: CloudinaryImage[];
  variants: ProductVariant[];
  basePrice: number; // price of the cheapest variant, for sorting
  status: ProductStatus;
  lowStockThreshold: number; // for inventory alerts
  createdAt: string;
  updatedAt: string;
}

// subscription
export interface Subscription {
  _id: string;
  vendor: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  paystackCustomerCode?: string; // for Paystack integration
  paystackSubscriptionCode?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean; // if true, subscription will cancel at the end of the current billing period
  createdAt: string;
  updatedAt: string;
}

// vendor
export interface Vendor {
  _id: string;
  businessName: string;
  handle: string; // unique username for storefront URL e.g store.ng/store/handle
  email?: string;
  phone: string;
  logo?: CloudinaryImage;
  bio?: string;
  location: {
    state: string;
    city: string;
    area?: string;
    coords?: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  socials: {
    instagram?: string;
    whatsapp?: string;
  };
  isActive: boolean;
  subscription?: Subscription;
  role: "vendor" | "admin";
  createdAt: string;
  updatedAt: string;
}

// customer (CRM)
export interface Customer {
  _id: string;
  vendor: string;
  name: string;
  email?: string;
  phone: string;
  instagram?: string;
  ltv: number; // lifetime value
  orderCount: number;
  lastOrderDate?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// order item
export interface OrderItem {
  product?: Product;
  productName: string; // store product name at time of order for historical accuracy
  variantLabel: string;
  price: number;
  quantity: number;
}

// order
export interface Order {
  _id: string;
  vendor: string;
  customer?: Customer; // optional for walk-in orders or if customer info isn't collected (MongoDB ObjectId)
  customerSnapshot: {
    name: string;
    phone: string;
    email?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  depositPaid: number;
  balanceOwed: number; // totalAmount - depositPaid
  status: OrderStatus;
  source: OrderSource;
  notes?: string;
  whatsappSent: boolean; // track if order details have been sent to customer via WhatsApp
  createdAt: string;
  updatedAt: string;
}


// analytics
export interface RevenueDataPoint {
  date: string; //ISO date string e.g "2024-06-01"
  revenue: number;
  orderCount: number;
}

export interface AnalyticsOverview {
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  totalOrders: number;
  pendingOrders: number;
  totalDebt: number; // total balance owed across all orders
  lowStockCount: number; // number of product variants below lowStockThreshold
}

export interface TopProduct {
  productId: string;
  name: string;
  totalSold: number;
  totalRevenue: number;
  image?: string;
}



// AUTH TYPES
export interface RegisterPayload {
  businessName: string;
  handle: string;
  phone: string;
  email?: string;
  password: string;
  location: {
    state: string;
    city: string;
    area?: string;
  };
}

export interface LoginCredentials {
  email: string; //email or phone - backend will accept both
  password: string;
}

//User object stored in the auth state (vendor subset)
export type AuthUser = Pick<Vendor, "_id" | "businessName" | "handle" | "email" | "phone" | "logo" | "subscription" | "role">;
/*
 * What is Pick<>?
 * Pick<Type, Keys> creates a new type that only includes the
 * specified keys from the original type. This is useful when
 * you don't need the full Vendor object in every place —
 * e.g. the auth state just needs identity info, not location coords.
 */

/* ============================================================
 * API RESPONSE WRAPPERS
 *
 * Generic types — the <T> is filled in at usage time:
 * - ApiResponse<Vendor>          → single vendor
 * - ApiResponse<Product[]>       → array of products
 * - PaginatedResponse<Order>     → paginated orders list
 * ============================================================ */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number; // total items across all pages
    page: number;  // current page number
    limit: number; // items per page
    totalPages: number; // total pages = Math.ceil(total / limit)
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}


// Error Type - used to surface readable messages from the axios error interceptor
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string>
  /*
   * Record<string, string> means: "an object with string keys
   * and string values" — like { email: "Email is required" }
   */
}

// Query Params
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  status?: ProductStatus;
  category?: string;
  search?: string; // for name/description search
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  startDate?: string; // ISO date string for filtering orders created after this date
  endDate?: string;
}

export interface CustomerQeryParams {
  page?: number;
  limit?: number;
  search?: string;
}

// FORM TYPES (separate from API types because they often have different requirements, e.g. optional fields, different naming, etc.)
export interface ProductFormValues {
  name: string;
  description?: string;
  category?: string;
  tags?: string;
  status: ProductStatus;
  variants: {
    label: string;
    size?: string;
    color?: string;
    custom?: string;
    sku?: string;
    price: number;
    quantity: number;
  }[];
}

export interface OrderFormValues {
  customerPhone: string;
  customerName: string;
  items: {
    productId: string;
    variantLabel: string;
    price: number;
    quantity: number;
  }[];
  depositPaid: number;
  notes?: string;
  source: OrderSource;
}


// Subscription plan config - rendering plan cards in pricing page (UI config only)
export interface PlanConfig {
  plan: SubscriptionPlan;
  name: string;
  price: number;           // in Naira. 0 = free
  priceDisplay: string;    // "Free" or "₦3,500/mo"
  description: string;
  features: string[];
  limits: {
    products: number | "unlimited";
    orders: number | "unlimited";  // per month
    staff: number;
  };
  highlighted?: boolean;   // true = "Most Popular" badge
}
export interface User {
  phoneNumber: string;
  name?: string;
  role: "user" | "admin";
  address?: {
    flatNumber: string;
    floorNumber: string;
    blockNumber: string;
    address: string;
    landmark: string;
  };
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface Product {
  productId: string;
  name: string;
  price: number;
  category: string;
  unit: string;
  image: string;
  description?: string;
  barcode?: string;
  stock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Order {
  orderId: string;
  orderedBy: string;
  status: "pending" | "accepted" | "delivered" | "cancelled";
  total: number;
  itemCount: number;
  deliveryAddress?: object;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  deliveredAt?: string;
}

export interface OrderItem {
  orderId: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  unit: string;
  subtotal: number;
}

export interface OTPRecord {
  phoneNumber: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

export interface JWTPayload {
  phoneNumber: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
}

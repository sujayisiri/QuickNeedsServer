import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Product } from "./CartContext";
import { API_ENDPOINTS, getAuthHeaders } from "../config/api";

export interface OrderItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = "pending" | "accepted" | "delivered" | "cancelled";

export interface Order {
  orderId: string;
  orderedBy: string; // phone number or user ID
  items: OrderItem[];
  itemCount?: number; // From backend list response
  status: OrderStatus;
  createdAt: Date;
  total?: number; // Optional since it might not be loaded in list view
}

interface OrdersContextType {
  orders: Order[];
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  addOrder: (orderedBy: string, items: OrderItem[]) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  getOrdersByUser: (userId: string) => Order[];
  getAllOrders: () => Order[];
  getPendingOrdersCount: () => number;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const OrdersProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders from API
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.orders.list, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch orders");
      }

      // Backend returns: { success: true, data: { orders: [], count: number } }
      // Convert ISO date strings back to Date objects
      const ordersData = (data.data.orders || []).map((order: any) => ({
        ...order,
        createdAt: new Date(order.createdAt),
      }));

      setOrders(ordersData);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load orders on mount and when token changes
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      fetchOrders();
    }
  }, []);

  const addOrder = async (
    orderedBy: string,
    items: OrderItem[],
  ): Promise<Order> => {
    try {
      const total = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );

      // Transform items to backend format
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        productImage: item.product.image,
        quantity: item.quantity,
        price: item.product.price,
        unit: item.product.unit,
      }));

      const response = await fetch(API_ENDPOINTS.orders.create, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          items: orderItems,
          total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      const newOrder: Order = {
        orderId: data.data.orderId,
        orderedBy,
        items,
        status: data.data.status,
        createdAt: new Date(data.data.createdAt),
        total: data.data.total,
      };

      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      console.error("Error creating order:", err);
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const response = await fetch(API_ENDPOINTS.orders.updateStatus(orderId), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update order status");
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId ? { ...order, status } : order,
        ),
      );
    } catch (err) {
      console.error("Error updating order status:", err);
      throw err;
    }
  };

  const getOrdersByUser = (userId: string): Order[] => {
    return orders.filter((order) => order.orderedBy === userId);
  };

  const getAllOrders = (): Order[] => {
    return orders;
  };

  const getPendingOrdersCount = (): number => {
    return orders.filter((order) => order.status === "pending").length;
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        loading,
        error,
        fetchOrders,
        addOrder,
        updateOrderStatus,
        getOrdersByUser,
        getAllOrders,
        getPendingOrdersCount,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};

export const useOrders = (): OrdersContextType => {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
};

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Product } from "./CartContext";
import { API_ENDPOINTS, getAuthHeaders } from "../config/api";

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: (category?: string) => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getTotalProductsCount: () => number;
}

const ProductsContext = createContext<ProductsContextType | undefined>(
  undefined,
);

export const ProductsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from API
  const fetchProducts = async (category?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = category
        ? `${API_ENDPOINTS.products.list}?category=${encodeURIComponent(category)}`
        : API_ENDPOINTS.products.list;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch products");
      }

      // Backend returns: { success: true, data: { products: [], count: number } }
      // Map productId to id for frontend compatibility
      const mappedProducts = (data.data.products || []).map((product: any) => ({
        ...product,
        id: product.productId,
      }));
      setProducts(mappedProducts);
    } catch (err) {
      setError((err as Error).message);
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (
    productData: Omit<Product, "id">,
  ): Promise<Product> => {
    try {
      const response = await fetch(API_ENDPOINTS.products.create, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add product");
      }

      // Backend returns: { success: true, data: { message: ..., product: {...} } }
      const newProduct = {
        ...data.data.product,
        id: data.data.product.productId, // Map productId to id for frontend
      };
      setProducts((prev) => [...prev, newProduct]);
      return newProduct;
    } catch (err) {
      console.error("Error adding product:", err);
      throw err;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const response = await fetch(API_ENDPOINTS.products.update(id), {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      setProducts((prev) =>
        prev.map((product) =>
          product.id === id ? { ...product, ...productData } : product,
        ),
      );
    } catch (err) {
      console.error("Error updating product:", err);
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.products.delete(id), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete product");
      }

      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (err) {
      console.error("Error deleting product:", err);
      throw err;
    }
  };

  const getProductById = (id: string): Product | undefined => {
    return products.find((product) => product.id === id);
  };

  const getTotalProductsCount = (): number => {
    return products.length;
  };

  return (
    <ProductsContext.Provider
      value={{
        products,
        loading,
        error,
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById,
        getTotalProductsCount,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = (): ProductsContextType => {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return context;
};

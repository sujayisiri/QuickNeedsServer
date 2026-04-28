import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonSearchbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonIcon,
  IonModal,
  IonBadge,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useProducts } from "../contexts/ProductsContext";
import { useOrders, Order, OrderItem } from "../contexts/OrdersContext";
import { API_ENDPOINTS, getAuthHeaders } from "../config/api";
import { add, receipt, chevronForward } from "ionicons/icons";
import { useState, useEffect } from "react";
import "./Home.css";

const Home: React.FC = () => {
  const { logout, phoneNumber } = useAuth();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { orders, fetchOrders } = useOrders();
  const history = useHistory();
  const [searchText, setSearchText] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch orders on mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Find the most recent ongoing order (pending or accepted)
  const ongoingOrder = orders.find(
    (order) => order.status === "pending" || order.status === "accepted",
  );

  const handleLogout = () => {
    logout();
    // ProtectedRoute will automatically redirect to /login
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  const featuredProducts = searchText ? filteredProducts : products.slice(0, 6);

  const handleViewOrder = async (order: Order) => {
    setShowOrderModal(true);

    // Fetch full order details with items
    try {
      const response = await fetch(API_ENDPOINTS.orders.get(order.orderId), {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (response.ok && data.data && data.data.order) {
        const orderData = data.data.order;

        // Transform backend items format to frontend format
        const transformedItems = (orderData.items || []).map(
          (item: {
            productId: string;
            productName: string;
            productImage: string;
            price: number;
            unit: string;
            quantity: number;
            subtotal: number;
          }) => ({
            product: {
              id: item.productId,
              name: item.productName,
              image: item.productImage,
              price: item.price,
              unit: item.unit,
              category: "",
              description: "",
            },
            quantity: item.quantity,
            subtotal: item.subtotal,
          }),
        );

        setSelectedOrder({
          ...orderData,
          items: transformedItems,
        });
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      setSelectedOrder(order);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "accepted":
        return "primary";
      case "delivered":
        return "success";
      case "cancelled":
        return "danger";
      default:
        return "medium";
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>QuickNeeds</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            placeholder="Search products..."
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
          />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="home-content">
        <div className="home-container">
          <div className="welcome-section">
            <IonText>
              <h2>Welcome to QuickNeeds! 🛒</h2>
              <p>
                Fresh groceries, vegetables & fruits delivered to your doorstep
              </p>
            </IonText>
          </div>

          {/* Ongoing Order Card */}
          {ongoingOrder && (
            <IonCard
              className="ongoing-order-card"
              button
              onClick={() => handleViewOrder(ongoingOrder)}
            >
              <IonCardContent>
                <div className="ongoing-order-header">
                  <div className="ongoing-order-icon">
                    <IonIcon icon={receipt} />
                  </div>
                  <div className="ongoing-order-info">
                    <h3>Ongoing Order</h3>
                    <p>
                      {ongoingOrder.itemCount ||
                        ongoingOrder.items?.length ||
                        0}{" "}
                      items • ₹{(ongoingOrder.total || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="ongoing-order-status">
                    <IonBadge color={getStatusColor(ongoingOrder.status)}>
                      {ongoingOrder.status}
                    </IonBadge>
                  </div>
                </div>
                <div className="ongoing-order-footer">
                  <span className="order-date">
                    {formatDate(ongoingOrder.createdAt)}
                  </span>
                  <IonIcon icon={chevronForward} />
                </div>
              </IonCardContent>
            </IonCard>
          )}

          <div className="products-section">
            <IonText>
              <h3>{searchText ? "Search Results" : "Featured Products"}</h3>
            </IonText>
            <IonGrid>
              <IonRow>
                {featuredProducts.map((product) => (
                  <IonCol size="6" sizeMd="4" sizeLg="3" key={product.id}>
                    <IonCard className="product-card">
                      <div className="product-image">
                        <span style={{ fontSize: "60px" }}>
                          {product.image}
                        </span>
                      </div>
                      <IonCardHeader>
                        <IonCardTitle className="product-name">
                          {product.name}
                        </IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <div className="product-info">
                          <IonText color="primary">
                            <h3>₹{product.price}</h3>
                          </IonText>
                          <IonText color="medium">
                            <p>per {product.unit}</p>
                          </IonText>
                        </div>
                        <IonButton
                          expand="block"
                          size="small"
                          color="tertiary"
                          onClick={() => addToCart(product)}
                        >
                          <IonIcon slot="start" icon={add} />
                          Add to Cart
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                ))}
              </IonRow>
            </IonGrid>
          </div>
        </div>
      </IonContent>

      {/* Order Details Modal */}
      <IonModal
        isOpen={showOrderModal}
        onDidDismiss={() => setShowOrderModal(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Order Details</IonTitle>
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => setShowOrderModal(false)}
            >
              Close
            </IonButton>
          </IonToolbar>
        </IonHeader>
        <IonContent className="order-modal-content">
          {selectedOrder && (
            <div className="order-modal">
              <div className="order-modal-header">
                <div className="order-modal-id">
                  <span className="label">Order Date</span>
                  <span className="value">
                    {formatDate(selectedOrder.createdAt)}
                  </span>
                </div>
                <IonBadge
                  color={getStatusColor(selectedOrder.status)}
                  className="order-modal-badge"
                >
                  {selectedOrder.status.toUpperCase()}
                </IonBadge>
              </div>

              <div className="order-modal-section">
                <h3 className="section-title">Order Items</h3>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="order-modal-items">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="order-modal-item">
                        <div className="item-icon">{item.product.image}</div>
                        <div className="item-info">
                          <div className="item-name">
                            {item.product.name || "Product"}
                          </div>
                          <div className="item-meta">
                            {item.quantity} {item.product.unit} × ₹
                            {item.product.price}
                          </div>
                        </div>
                        <div className="item-price">
                          ₹
                          {(
                            (item as OrderItem & { subtotal?: number })
                              .subtotal || item.product.price * item.quantity
                          ).toFixed(2)}
                        </div>
                      </div>
                    ))}

                    <div className="order-modal-total">
                      <span>Total Amount</span>
                      <span className="total-amount">
                        ₹{(selectedOrder.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="loading-items">
                    <p>Loading order items...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Home;

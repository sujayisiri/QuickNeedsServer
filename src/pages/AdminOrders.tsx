import { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonModal,
} from "@ionic/react";
import { checkmark, close, eye } from "ionicons/icons";
import { useOrders, Order, OrderStatus } from "../contexts/OrdersContext";
import { API_ENDPOINTS, getAuthHeaders } from "../config/api";
import "./AdminOrders.css";

const AdminOrders: React.FC = () => {
  const { orders, updateOrderStatus, fetchOrders } = useOrders();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch orders when component mounts
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders =
    selectedStatus === "all"
      ? orders
      : orders.filter((order) => order.status === selectedStatus);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (error) {
      console.error("Error updating order status:", error);
      // You could show a toast notification here
    }
  };

  const handleViewOrder = async (order: Order) => {
    setShowModal(true);

    // Always fetch full order details with items and customer profile
    try {
      const [orderResponse, profileResponse] = await Promise.all([
        fetch(API_ENDPOINTS.orders.get(order.orderId), {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_ENDPOINTS.users.profile}?phoneNumber=${order.orderedBy}`, {
          headers: getAuthHeaders(),
        }),
      ]);

      const orderData = await orderResponse.json();
      const profileData = await profileResponse.json();

      if (orderResponse.ok && orderData.data && orderData.data.order) {
        const fullOrder = orderData.data.order;

        // Transform backend items format to frontend format
        const transformedItems = (fullOrder.items || []).map((item: any) => ({
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
        }));

        // Add customer details from profile
        const customerName =
          profileResponse.ok && profileData.data
            ? profileData.data.name || "Customer"
            : "Customer";

        const customerAddress =
          profileResponse.ok && profileData.data?.address
            ? profileData.data.address
            : null;

        setSelectedOrder({
          ...fullOrder,
          items: transformedItems,
          customerName,
          customerAddress,
        });
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      // Still show the modal with basic order info
      setSelectedOrder(order);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Orders</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Orders</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="admin-orders-container">
          <IonSegment
            value={selectedStatus}
            onIonChange={(e) => setSelectedStatus(e.detail.value as string)}
            scrollable
          >
            <IonSegmentButton value="all">
              <IonLabel>All ({orders.length})</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="pending">
              <IonLabel>
                Pending ({orders.filter((o) => o.status === "pending").length})
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="accepted">
              <IonLabel>
                Accepted ({orders.filter((o) => o.status === "accepted").length}
                )
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="delivered">
              <IonLabel>
                Delivered (
                {orders.filter((o) => o.status === "delivered").length})
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="cancelled">
              <IonLabel>
                Cancelled (
                {orders.filter((o) => o.status === "cancelled").length})
              </IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {filteredOrders.length === 0 ? (
            <IonCard>
              <IonCardContent>
                <p className="no-orders">No orders found</p>
              </IonCardContent>
            </IonCard>
          ) : (
            <IonList>
              {filteredOrders.map((order) => (
                <IonCard key={order.orderId} className="order-card">
                  <IonCardHeader>
                    <div className="order-header">
                      <div className="order-id-section">
                        <p className="order-id-label">
                          Order #{order.orderId.slice(0, 8)}
                        </p>
                        <p className="order-date">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <IonBadge
                        color={getStatusColor(order.status)}
                        className="status-badge"
                      >
                        {order.status.toUpperCase()}
                      </IonBadge>
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="order-summary">
                      <div className="order-info-grid">
                        <div className="info-item">
                          <span className="info-label">Customer</span>
                          <span className="info-value">{order.orderedBy}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Items</span>
                          <span className="info-value">
                            {order.itemCount} items
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Total Amount</span>
                          <span className="info-value total-highlight">
                            ₹{(order.total || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="order-actions">
                      <IonButton
                        size="small"
                        fill="outline"
                        onClick={() => handleViewOrder(order)}
                      >
                        <IonIcon icon={eye} slot="start" />
                        View Details
                      </IonButton>

                      {order.status === "pending" && (
                        <>
                          <IonButton
                            size="small"
                            color="success"
                            onClick={() =>
                              handleStatusChange(order.orderId, "accepted")
                            }
                          >
                            <IonIcon icon={checkmark} slot="start" />
                            Accept
                          </IonButton>
                          <IonButton
                            size="small"
                            color="danger"
                            fill="outline"
                            onClick={() =>
                              handleStatusChange(order.orderId, "cancelled")
                            }
                          >
                            <IonIcon icon={close} slot="start" />
                            Reject
                          </IonButton>
                        </>
                      )}

                      {order.status === "accepted" && (
                        <IonButton
                          size="small"
                          color="primary"
                          onClick={() =>
                            handleStatusChange(order.orderId, "delivered")
                          }
                        >
                          <IonIcon icon={checkmark} slot="start" />
                          Mark Delivered
                        </IonButton>
                      )}
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </IonList>
          )}
        </div>

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Order Details</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                onClick={() => setShowModal(false)}
              >
                Close
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="order-details-content">
            {selectedOrder && (
              <div className="order-details-modal">
                {/* Compact Header */}
                <div className="modal-order-header">
                  <div className="modal-order-id">
                    <span className="label">Order ID</span>
                    <span className="value">
                      #{selectedOrder.orderId.slice(0, 8)}
                    </span>
                  </div>
                  <IonBadge
                    color={getStatusColor(selectedOrder.status)}
                    className="modal-status-badge"
                  >
                    {selectedOrder.status.toUpperCase()}
                  </IonBadge>
                </div>

                {/* Order Info Grid */}
                <div className="modal-info-grid">
                  <div className="modal-info-item">
                    <span className="label">Customer</span>
                    <span className="value">
                      {(selectedOrder as any).customerName ||
                        selectedOrder.orderedBy}
                    </span>
                  </div>
                  <div className="modal-info-item">
                    <span className="label">Date</span>
                    <span className="value">
                      {formatDate(selectedOrder.createdAt)}
                    </span>
                  </div>
                  <div className="modal-info-item">
                    <span className="label">Items</span>
                    <span className="value">
                      {selectedOrder.itemCount} items
                    </span>
                  </div>
                  <div className="modal-info-item">
                    <span className="label">Total</span>
                    <span className="value total">
                      ₹{(selectedOrder.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="modal-section">
                  <h3 className="section-title">Order Items</h3>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div className="modal-items-list">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="modal-item">
                          <div className="modal-item-icon">
                            {item.product.image}
                          </div>
                          <div className="modal-item-info">
                            <div className="modal-item-name">
                              {item.product.name || "Product"}
                            </div>
                            <div className="modal-item-meta">
                              {item.quantity} {item.product.unit} × ₹
                              {item.product.price}
                            </div>
                          </div>
                          <div className="modal-item-price">
                            ₹
                            {(
                              (item as any).subtotal ||
                              item.product.price * item.quantity
                            ).toFixed(2)}
                          </div>
                        </div>
                      ))}

                      <div className="modal-total">
                        <span>Total Amount</span>
                        <span className="modal-total-amount">
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

                {/* Customer Details */}
                <div className="modal-section">
                  <h3 className="section-title">Customer Information</h3>
                  <div className="customer-details">
                    <div className="customer-detail-row">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">
                        {(selectedOrder as any).customerName || "Not provided"}
                      </span>
                    </div>
                    <div className="customer-detail-row">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">
                        {selectedOrder.orderedBy}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery Address */}
                {(selectedOrder as any).customerAddress && (
                  <div className="modal-section">
                    <h3 className="section-title">Delivery Address</h3>
                    <div className="address-card">
                      {(selectedOrder as any).customerAddress.flatNumber && (
                        <div className="address-line">
                          <strong>Flat/House:</strong>{" "}
                          {(selectedOrder as any).customerAddress.flatNumber}
                          {(selectedOrder as any).customerAddress.floorNumber &&
                            `, Floor ${(selectedOrder as any).customerAddress.floorNumber}`}
                          {(selectedOrder as any).customerAddress.blockNumber &&
                            `, Block ${(selectedOrder as any).customerAddress.blockNumber}`}
                        </div>
                      )}
                      {(selectedOrder as any).customerAddress.address && (
                        <div className="address-line">
                          {(selectedOrder as any).customerAddress.address}
                        </div>
                      )}
                      {(selectedOrder as any).customerAddress.landmark && (
                        <div className="address-line">
                          <strong>Landmark:</strong>{" "}
                          {(selectedOrder as any).customerAddress.landmark}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!(selectedOrder as any).customerAddress && (
                  <div className="modal-section">
                    <h3 className="section-title">Delivery Address</h3>
                    <p className="modal-address no-address">
                      Address not provided by customer
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedOrder.status !== "delivered" &&
                  selectedOrder.status !== "cancelled" && (
                    <div className="modal-actions">
                      {selectedOrder.status === "pending" && (
                        <>
                          <IonButton
                            expand="block"
                            color="success"
                            onClick={() => {
                              handleStatusChange(
                                selectedOrder.orderId,
                                "accepted",
                              );
                              setShowModal(false);
                            }}
                          >
                            <IonIcon icon={checkmark} slot="start" />
                            Accept Order
                          </IonButton>
                          <IonButton
                            expand="block"
                            color="danger"
                            fill="outline"
                            onClick={() => {
                              handleStatusChange(
                                selectedOrder.orderId,
                                "cancelled",
                              );
                              setShowModal(false);
                            }}
                          >
                            <IonIcon icon={close} slot="start" />
                            Reject Order
                          </IonButton>
                        </>
                      )}
                      {selectedOrder.status === "accepted" && (
                        <IonButton
                          expand="block"
                          color="primary"
                          onClick={() => {
                            handleStatusChange(
                              selectedOrder.orderId,
                              "delivered",
                            );
                            setShowModal(false);
                          }}
                        >
                          <IonIcon icon={checkmark} slot="start" />
                          Mark as Delivered
                        </IonButton>
                      )}
                    </div>
                  )}
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default AdminOrders;

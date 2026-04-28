import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonModal,
  IonBadge,
  useIonToast,
} from "@ionic/react";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useOrders, Order, OrderItem } from "../contexts/OrdersContext";
import { API_ENDPOINTS, getAuthHeaders } from "../config/api";
import {
  person,
  call,
  home,
  business,
  logOut,
  create,
  receipt,
  chevronForward,
  arrowBack,
} from "ionicons/icons";
import "./Account.css";

interface UserProfile {
  name: string;
  phone: string;
  flatNumber: string;
  floorNumber: string;
  blockNumber: string;
  address: string;
  landmark: string;
}

const Account: React.FC = () => {
  const { phoneNumber, logout } = useAuth();
  const { orders, fetchOrders } = useOrders();
  const [present] = useIonToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentView, setCurrentView] = useState<"menu" | "orders" | "account">(
    "menu",
  );

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    phone: phoneNumber || "",
    flatNumber: "",
    floorNumber: "",
    blockNumber: "",
    address: "",
    landmark: "",
  });

  // Fetch profile from API
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.users.profile, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.ok && data.data) {
        const userData = data.data;
        setProfile({
          name: userData.name || "",
          phone: userData.phoneNumber || phoneNumber || "",
          flatNumber: userData.address?.flatNumber || "",
          floorNumber: userData.address?.floorNumber || "",
          blockNumber: userData.address?.blockNumber || "",
          address: userData.address?.address || "",
          landmark: userData.address?.landmark || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      present({
        message: "Failed to load profile",
        duration: 2000,
        color: "danger",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load profile and orders from API on mount
  useEffect(() => {
    fetchProfile();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.users.updateProfile, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: profile.name,
          address: {
            flatNumber: profile.flatNumber,
            floorNumber: profile.floorNumber,
            blockNumber: profile.blockNumber,
            address: profile.address,
            landmark: profile.landmark,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setIsEditing(false);
      present({
        message: "Profile updated successfully!",
        duration: 2000,
        color: "success",
        position: "top",
      });

      // Refresh profile data
      await fetchProfile();
    } catch (error) {
      present({
        message: (error as Error).message || "Failed to update profile",
        duration: 3000,
        color: "danger",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reload profile from API to discard changes
    fetchProfile();
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    // ProtectedRoute will automatically redirect to /login
  };

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
          {currentView !== "menu" && (
            <IonButton
              slot="start"
              fill="clear"
              onClick={() => {
                setCurrentView("menu");
                if (isEditing) setIsEditing(false);
              }}
            >
              <IonIcon icon={arrowBack} />
            </IonButton>
          )}
          <IonTitle>
            {currentView === "menu"
              ? "Account"
              : currentView === "orders"
                ? "My Orders"
                : "Account Details"}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="account-content">
        {loading ? (
          <div className="loading-container">
            <IonText color="medium">
              <p>Loading profile...</p>
            </IonText>
          </div>
        ) : (
          <div className="account-container">
            {/* Main Menu View */}
            {currentView === "menu" && (
              <>
                {/* Profile Header */}
                <div className="profile-header">
                  <div className="avatar">
                    <IonIcon icon={person} />
                  </div>
                  <IonText>
                    <h2>{profile.name || "Guest User"}</h2>
                    <p>{profile.phone}</p>
                  </IonText>
                </div>

                {/* Menu List */}
                <IonList className="menu-list">
                  <IonItem
                    button
                    onClick={() => setCurrentView("orders")}
                    detail={false}
                  >
                    <IonIcon icon={receipt} slot="start" color="primary" />
                    <IonLabel>
                      <h2>My Orders</h2>
                      <p>{orders.length} orders</p>
                    </IonLabel>
                    <IonIcon icon={chevronForward} slot="end" />
                  </IonItem>

                  <IonItem
                    button
                    onClick={() => setCurrentView("account")}
                    detail={false}
                  >
                    <IonIcon icon={person} slot="start" color="primary" />
                    <IonLabel>
                      <h2>Account Details</h2>
                      <p>Profile & address information</p>
                    </IonLabel>
                    <IonIcon icon={chevronForward} slot="end" />
                  </IonItem>

                  <IonItem button onClick={handleLogout} detail={false}>
                    <IonIcon icon={logOut} slot="start" color="danger" />
                    <IonLabel color="danger">
                      <h2>Logout</h2>
                    </IonLabel>
                  </IonItem>
                </IonList>
              </>
            )}

            {/* Orders View */}
            {currentView === "orders" && (
              <div className="orders-view">
                {orders.length === 0 ? (
                  <div className="no-orders">
                    <IonIcon icon={receipt} />
                    <p>No orders yet</p>
                  </div>
                ) : (
                  <div className="orders-grid">
                    {orders.map((order) => (
                      <IonCard
                        key={order.orderId}
                        className="order-card"
                        button
                        onClick={() => handleViewOrder(order)}
                      >
                        <IonCardContent>
                          <div className="order-card-header">
                            <span className="order-date">
                              {formatDate(order.createdAt)}
                            </span>
                            <IonBadge color={getStatusColor(order.status)}>
                              {order.status}
                            </IonBadge>
                          </div>
                          <div className="order-card-details">
                            <div className="order-info">
                              <IonIcon icon={receipt} />
                              <span>
                                {order.itemCount || order.items?.length || 0}{" "}
                                items
                              </span>
                            </div>
                            <div className="order-total">
                              ₹{(order.total || 0).toFixed(2)}
                            </div>
                          </div>
                        </IonCardContent>
                      </IonCard>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Account Details View */}
            {currentView === "account" && (
              <div className="account-details-view">
                {isEditing ? (
                  <>
                    <IonList>
                      <IonItem>
                        <IonIcon icon={person} slot="start" />
                        <IonLabel position="stacked">Full Name</IonLabel>
                        <IonInput
                          placeholder="Enter your name"
                          value={profile.name}
                          onIonInput={(e) =>
                            setProfile({
                              ...profile,
                              name: e.detail.value!,
                            })
                          }
                        />
                      </IonItem>
                      <IonItem>
                        <IonIcon icon={call} slot="start" />
                        <IonLabel position="stacked">Phone Number</IonLabel>
                        <IonInput type="tel" value={profile.phone} disabled />
                      </IonItem>
                      <div className="address-row">
                        <IonItem className="address-item">
                          <IonIcon icon={home} slot="start" />
                          <IonLabel position="stacked">Flat Number</IonLabel>
                          <IonInput
                            placeholder="e.g., 101"
                            value={profile.flatNumber}
                            onIonInput={(e) =>
                              setProfile({
                                ...profile,
                                flatNumber: e.detail.value!,
                              })
                            }
                          />
                        </IonItem>
                        <IonItem className="address-item">
                          <IonIcon icon={business} slot="start" />
                          <IonLabel position="stacked">Floor</IonLabel>
                          <IonInput
                            placeholder="e.g., 1st"
                            value={profile.floorNumber}
                            onIonInput={(e) =>
                              setProfile({
                                ...profile,
                                floorNumber: e.detail.value!,
                              })
                            }
                          />
                        </IonItem>
                      </div>
                      <IonItem>
                        <IonIcon icon={business} slot="start" />
                        <IonLabel position="stacked">Block Number</IonLabel>
                        <IonInput
                          placeholder="e.g., A"
                          value={profile.blockNumber}
                          onIonInput={(e) =>
                            setProfile({
                              ...profile,
                              blockNumber: e.detail.value!,
                            })
                          }
                        />
                      </IonItem>
                      <IonItem>
                        <IonIcon icon={home} slot="start" />
                        <IonLabel position="stacked">Complete Address</IonLabel>
                        <IonInput
                          placeholder="Street, Area, City"
                          value={profile.address}
                          onIonInput={(e) =>
                            setProfile({ ...profile, address: e.detail.value! })
                          }
                        />
                      </IonItem>
                      <IonItem>
                        <IonIcon icon={home} slot="start" />
                        <IonLabel position="stacked">
                          Landmark (Optional)
                        </IonLabel>
                        <IonInput
                          placeholder="Nearby landmark"
                          value={profile.landmark}
                          onIonInput={(e) =>
                            setProfile({
                              ...profile,
                              landmark: e.detail.value!,
                            })
                          }
                        />
                      </IonItem>
                    </IonList>

                    <div className="account-actions">
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        Cancel
                      </IonButton>
                      <IonButton
                        expand="block"
                        color="tertiary"
                        onClick={handleSave}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </IonButton>
                    </div>
                  </>
                ) : (
                  <>
                    <IonCard>
                      <IonCardHeader>
                        <IonCardTitle>Personal Information</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <div className="profile-details">
                          <div className="detail-item">
                            <IonIcon icon={person} />
                            <div>
                              <IonLabel>Full Name</IonLabel>
                              <IonText>
                                <p>{profile.name || "Not provided"}</p>
                              </IonText>
                            </div>
                          </div>
                          <div className="detail-item">
                            <IonIcon icon={call} />
                            <div>
                              <IonLabel>Phone Number</IonLabel>
                              <IonText>
                                <p>{profile.phone}</p>
                              </IonText>
                            </div>
                          </div>
                        </div>
                      </IonCardContent>
                    </IonCard>

                    <IonCard>
                      <IonCardHeader>
                        <IonCardTitle>Delivery Address</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <div className="profile-details">
                          <div className="detail-item">
                            <IonIcon icon={home} />
                            <div>
                              <IonLabel>Flat Number</IonLabel>
                              <IonText>
                                <p>{profile.flatNumber || "Not provided"}</p>
                              </IonText>
                            </div>
                          </div>
                          <div className="detail-item">
                            <IonIcon icon={business} />
                            <div>
                              <IonLabel>Floor</IonLabel>
                              <IonText>
                                <p>{profile.floorNumber || "Not provided"}</p>
                              </IonText>
                            </div>
                          </div>
                          <div className="detail-item">
                            <IonIcon icon={business} />
                            <div>
                              <IonLabel>Block Number</IonLabel>
                              <IonText>
                                <p>{profile.blockNumber || "Not provided"}</p>
                              </IonText>
                            </div>
                          </div>
                          <div className="detail-item">
                            <IonIcon icon={home} />
                            <div>
                              <IonLabel>Address</IonLabel>
                              <IonText>
                                <p>{profile.address || "Not provided"}</p>
                              </IonText>
                            </div>
                          </div>
                          {profile.landmark && (
                            <div className="detail-item">
                              <IonIcon icon={home} />
                              <div>
                                <IonLabel>Landmark</IonLabel>
                                <IonText>
                                  <p>{profile.landmark}</p>
                                </IonText>
                              </div>
                            </div>
                          )}
                        </div>
                      </IonCardContent>
                    </IonCard>

                    <div className="account-actions">
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={() => setIsEditing(true)}
                      >
                        <IonIcon icon={create} slot="start" />
                        Edit Profile
                      </IonButton>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
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

export default Account;

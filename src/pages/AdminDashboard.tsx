import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
} from "@ionic/react";
import { bagHandle, cube, checkmarkDone, hourglass } from "ionicons/icons";
import { useOrders } from "../contexts/OrdersContext";
import { useProducts } from "../contexts/ProductsContext";
import { useEffect } from "react";
import "./AdminDashboard.css";

const AdminDashboard: React.FC = () => {
  const { orders, fetchOrders } = useOrders();
  const { getTotalProductsCount, fetchProducts } = useProducts();

  // Fetch data when component mounts
  useEffect(() => {
    fetchOrders();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const completedOrders = orders.filter((o) => o.status === "delivered").length;
  const totalProducts = getTotalProductsCount();

  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, order) => sum + order.total, 0);

  const stats = [
    {
      title: "Total Orders",
      value: totalOrders,
      icon: bagHandle,
      color: "primary",
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      icon: hourglass,
      color: "warning",
    },
    {
      title: "Completed Orders",
      value: completedOrders,
      icon: checkmarkDone,
      color: "success",
    },
    {
      title: "Total Products",
      value: totalProducts,
      icon: cube,
      color: "tertiary",
    },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>

        <div className="admin-dashboard-container">
          <IonGrid>
            <IonRow>
              {stats.map((stat, index) => (
                <IonCol size="6" key={index}>
                  <IonCard className={`stat-card stat-card-${stat.color}`}>
                    <IonCardHeader>
                      <div className="stat-icon-container">
                        <IonIcon icon={stat.icon} className="stat-icon" />
                      </div>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="stat-value">{stat.value}</div>
                      <div className="stat-title">{stat.title}</div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>

          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Revenue</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <div className="revenue-display">₹{totalRevenue.toFixed(2)}</div>
              <p className="revenue-subtitle">From completed orders</p>
            </IonCardContent>
          </IonCard>

          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Recent Orders</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {orders.length === 0 ? (
                <p className="no-activity">No orders yet</p>
              ) : (
                <div className="activity-list">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.orderId} className="activity-item">
                      <div className="activity-info">
                        <div className="activity-title">{order.orderedBy}</div>
                        <div className="activity-subtitle">
                          {order.itemCount} items • ₹
                          {(order.total || 0).toFixed(2)} •{" "}
                          {new Date(order.createdAt).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className={`activity-status status-${order.status}`}>
                        {order.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;

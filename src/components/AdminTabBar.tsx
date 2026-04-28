import {
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonBadge,
} from "@ionic/react";
import { statsChart, cube, receipt, person } from "ionicons/icons";
import { useOrders } from "../contexts/OrdersContext";

const AdminTabBar: React.FC = () => {
  const { getPendingOrdersCount } = useOrders();
  const pendingCount = getPendingOrdersCount();

  return (
    <IonTabBar slot="bottom">
      <IonTabButton tab="dashboard" href="/admin/dashboard">
        <IonIcon aria-hidden="true" icon={statsChart} />
        <IonLabel>Dashboard</IonLabel>
      </IonTabButton>
      <IonTabButton tab="products" href="/admin/products">
        <IonIcon aria-hidden="true" icon={cube} />
        <IonLabel>Products</IonLabel>
      </IonTabButton>
      <IonTabButton tab="orders" href="/admin/orders">
        <IonIcon aria-hidden="true" icon={receipt} />
        <IonLabel>Orders</IonLabel>
        {pendingCount > 0 && (
          <IonBadge
            color="danger"
            style={{ position: "absolute", top: "4px", right: "20%" }}
          >
            {pendingCount}
          </IonBadge>
        )}
      </IonTabButton>
      <IonTabButton tab="account" href="/admin/account">
        <IonIcon aria-hidden="true" icon={person} />
        <IonLabel>Account</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

export default AdminTabBar;

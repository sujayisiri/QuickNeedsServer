import {
  IonIcon,
  IonLabel,
  IonTabBar,
  IonTabButton,
  IonBadge,
} from "@ionic/react";
import { home, grid, cart, person } from "ionicons/icons";
import { useCart } from "../contexts/CartContext";

const AppTabBar: React.FC = () => {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  return (
    <IonTabBar slot="bottom">
      <IonTabButton tab="home" href="/tabs/home">
        <IonIcon aria-hidden="true" icon={home} />
        <IonLabel>Home</IonLabel>
      </IonTabButton>
      <IonTabButton tab="categories" href="/tabs/categories">
        <IonIcon aria-hidden="true" icon={grid} />
        <IonLabel>Categories</IonLabel>
      </IonTabButton>
      <IonTabButton tab="cart" href="/tabs/cart">
        <IonIcon aria-hidden="true" icon={cart} />
        <IonLabel>Cart</IonLabel>
        {cartCount > 0 && (
          <IonBadge
            color="danger"
            style={{ position: "absolute", top: "4px", right: "20%" }}
          >
            {cartCount}
          </IonBadge>
        )}
      </IonTabButton>
      <IonTabButton tab="account" href="/tabs/account">
        <IonIcon aria-hidden="true" icon={person} />
        <IonLabel>Account</IonLabel>
      </IonTabButton>
    </IonTabBar>
  );
};

export default AppTabBar;

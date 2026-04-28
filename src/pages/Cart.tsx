import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonText,
  IonCard,
  IonCardContent,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  useIonToast,
} from "@ionic/react";
import { useCart } from "../contexts/CartContext";
import { useOrders } from "../contexts/OrdersContext";
import { useAuth } from "../contexts/AuthContext";
import { add, remove, trash } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import "./Cart.css";

const Cart: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } =
    useCart();
  const { addOrder } = useOrders();
  const { phoneNumber } = useAuth();
  const [present] = useIonToast();
  const history = useHistory();

  const handleCheckout = async () => {
    if (cart.length === 0) {
      return;
    }

    try {
      // Create order items from cart
      const orderItems = cart.map((item) => ({
        product: {
          id: item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          category: item.category,
          unit: item.unit,
          description: item.description,
        },
        quantity: item.quantity,
      }));

      // Create the order
      const order = await addOrder(phoneNumber || "Guest", orderItems);

      // Clear the cart
      clearCart();

      // Show success message
      present({
        message: `Order ${order.orderId} placed successfully!`,
        duration: 3000,
        color: "success",
        position: "top",
      });

      // Navigate to home
      history.push("/tabs/home");
    } catch (error) {
      present({
        message: "Failed to place order. Please try again.",
        duration: 3000,
        color: "danger",
        position: "top",
      });
    }
  };

  if (cart.length === 0) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Cart</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="cart-content">
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <IonText>
              <h2>Your cart is empty</h2>
              <p>Add some products to get started</p>
            </IonText>
            <IonButton
              color="tertiary"
              onClick={() => history.push("/tabs/home")}
            >
              Start Shopping
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cart ({cart.length} items)</IonTitle>
          <IonButton slot="end" fill="clear" color="danger" onClick={clearCart}>
            Clear All
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="cart-content">
        <div className="cart-container">
          <IonList className="cart-list">
            {cart.map((item) => (
              <IonItemSliding key={item.id}>
                <IonItem className="cart-item">
                  <div className="item-image" slot="start">
                    <span style={{ fontSize: "40px" }}>{item.image}</span>
                  </div>
                  <IonLabel>
                    <h2>{item.name}</h2>
                    <p>
                      ₹{item.price} per {item.unit}
                    </p>
                    <IonText color="primary">
                      <h3>₹{item.price * item.quantity}</h3>
                    </IonText>
                  </IonLabel>
                  <div className="quantity-controls" slot="end">
                    <IonButton
                      size="small"
                      fill="outline"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <IonIcon icon={remove} />
                    </IonButton>
                    <span className="quantity">{item.quantity}</span>
                    <IonButton
                      size="small"
                      fill="outline"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <IonIcon icon={add} />
                    </IonButton>
                  </div>
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption
                    color="danger"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <IonIcon icon={trash} />
                    Delete
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>

          <IonCard className="cart-summary">
            <IonCardContent>
              <div className="summary-row">
                <IonText>
                  <p>Subtotal</p>
                </IonText>
                <IonText>
                  <p>₹{getCartTotal()}</p>
                </IonText>
              </div>
              <div className="summary-row">
                <IonText>
                  <p>Delivery Fee</p>
                </IonText>
                <IonText color="success">
                  <p>FREE</p>
                </IonText>
              </div>
              <div className="summary-row total">
                <IonText>
                  <h2>Total</h2>
                </IonText>
                <IonText color="primary">
                  <h2>₹{getCartTotal()}</h2>
                </IonText>
              </div>
              <IonButton
                expand="block"
                size="large"
                color="tertiary"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </IonButton>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Cart;

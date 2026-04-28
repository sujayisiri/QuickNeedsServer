import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  IonTabs,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import Cart from "./pages/Cart";
import Account from "./pages/Account";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { OrdersProvider } from "./contexts/OrdersContext";
import { ProductsProvider } from "./contexts/ProductsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppTabBar from "./components/AppTabBar";
import AdminTabBar from "./components/AdminTabBar";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.css";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <CartProvider>
        <OrdersProvider>
          <ProductsProvider>
            <IonReactRouter>
              <IonRouterOutlet>
                <Route exact path="/login">
                  <Login />
                </Route>

                {/* Onboarding Route - Protected but accessible during initial setup */}
                <ProtectedRoute exact path="/onboarding" requiredRole="user">
                  <Onboarding />
                </ProtectedRoute>

                {/* User Routes */}
                <ProtectedRoute path="/tabs" requiredRole="user">
                  <IonTabs>
                    <IonRouterOutlet>
                      <Route exact path="/tabs/home">
                        <Home />
                      </Route>
                      <Route exact path="/tabs/categories">
                        <Categories />
                      </Route>
                      <Route exact path="/tabs/cart">
                        <Cart />
                      </Route>
                      <Route exact path="/tabs/account">
                        <Account />
                      </Route>
                      <Route exact path="/tabs">
                        <Redirect to="/tabs/home" />
                      </Route>
                    </IonRouterOutlet>
                    <AppTabBar />
                  </IonTabs>
                </ProtectedRoute>

                {/* Admin Routes */}
                <ProtectedRoute path="/admin" requiredRole="admin">
                  <IonTabs>
                    <IonRouterOutlet>
                      <Route exact path="/admin/dashboard">
                        <AdminDashboard />
                      </Route>
                      <Route exact path="/admin/products">
                        <AdminProducts />
                      </Route>
                      <Route exact path="/admin/orders">
                        <AdminOrders />
                      </Route>
                      <Route exact path="/admin/account">
                        <Account />
                      </Route>
                      <Route exact path="/admin">
                        <Redirect to="/admin/dashboard" />
                      </Route>
                    </IonRouterOutlet>
                    <AdminTabBar />
                  </IonTabs>
                </ProtectedRoute>

                <Route exact path="/">
                  <Redirect to="/login" />
                </Route>
              </IonRouterOutlet>
            </IonReactRouter>
          </ProductsProvider>
        </OrdersProvider>
      </CartProvider>
    </AuthProvider>
  </IonApp>
);

export default App;

import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ExploreContainer from "../components/ExploreContainer";
import "./Tab1.css";

const Tab1: React.FC = () => {
  const { logout, phoneNumber } = useAuth();
  const history = useHistory();

  const handleLogout = () => {
    logout();
    // ProtectedRoute will automatically redirect to /login
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tab 1</IonTitle>
          <IonButton slot="end" fill="clear" onClick={handleLogout}>
            Logout
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Tab 1</IonTitle>
          </IonToolbar>
        </IonHeader>
        <ExploreContainer name="Tab 1 page" />
        {phoneNumber && (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p>
              Logged in as: <strong>{phoneNumber}</strong>
            </p>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Tab1;

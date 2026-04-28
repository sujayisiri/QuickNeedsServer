import { useState } from "react";
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonText,
  IonItem,
  IonLabel,
  IonTextarea,
  IonHeader,
  IonToolbar,
  IonTitle,
  useIonToast,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { API_ENDPOINTS, getAuthHeaders } from "../config/api";
import "./Onboarding.css";

const Onboarding: React.FC = () => {
  const [name, setName] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [blockNumber, setBlockNumber] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [loading, setLoading] = useState(false);
  const [present] = useIonToast();
  const history = useHistory();

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      present({
        message: "Please enter your name",
        duration: 2000,
        color: "warning",
        position: "top",
      });
      return;
    }

    if (!flatNumber.trim() || !address.trim()) {
      present({
        message: "Please enter your flat number and address",
        duration: 2000,
        color: "warning",
        position: "top",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.users.updateProfile, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          address: {
            flatNumber: flatNumber.trim(),
            floorNumber: floorNumber.trim(),
            blockNumber: blockNumber.trim(),
            address: address.trim(),
            landmark: landmark.trim(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Mark onboarding as complete
      localStorage.setItem("profileComplete", "true");

      present({
        message: "Profile setup complete!",
        duration: 2000,
        color: "success",
        position: "top",
      });

      // Redirect to home
      history.replace("/tabs/home");
    } catch (error) {
      present({
        message: (error as Error).message || "Failed to save profile",
        duration: 3000,
        color: "danger",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Complete Your Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="onboarding-content">
        <div className="onboarding-container">
          <div className="onboarding-header">
            <div className="onboarding-icon">👋</div>
            <IonText>
              <h2>Welcome to QuickNeeds!</h2>
              <p>Let's set up your profile to get started</p>
            </IonText>
          </div>

          <div className="onboarding-form">
            <IonItem className="form-item">
              <IonLabel position="stacked">Full Name *</IonLabel>
              <IonInput
                value={name}
                placeholder="Enter your full name"
                onIonInput={(e) => setName(e.detail.value || "")}
                disabled={loading}
              />
            </IonItem>

            <div className="form-section-title">
              <IonText color="medium">
                <h3>Delivery Address</h3>
              </IonText>
            </div>

            <div className="address-grid">
              <IonItem className="form-item grid-item">
                <IonLabel position="stacked">Flat Number *</IonLabel>
                <IonInput
                  value={flatNumber}
                  placeholder="e.g., 101"
                  onIonInput={(e) => setFlatNumber(e.detail.value || "")}
                  disabled={loading}
                />
              </IonItem>

              <IonItem className="form-item grid-item">
                <IonLabel position="stacked">Floor Number</IonLabel>
                <IonInput
                  value={floorNumber}
                  placeholder="e.g., 1st"
                  onIonInput={(e) => setFloorNumber(e.detail.value || "")}
                  disabled={loading}
                />
              </IonItem>

              <IonItem className="form-item grid-item">
                <IonLabel position="stacked">Block Number</IonLabel>
                <IonInput
                  value={blockNumber}
                  placeholder="e.g., A"
                  onIonInput={(e) => setBlockNumber(e.detail.value || "")}
                  disabled={loading}
                />
              </IonItem>
            </div>

            <IonItem className="form-item">
              <IonLabel position="stacked">Full Address *</IonLabel>
              <IonTextarea
                value={address}
                placeholder="Street, Area, City, PIN"
                rows={3}
                onIonInput={(e) => setAddress(e.detail.value || "")}
                disabled={loading}
              />
            </IonItem>

            <IonItem className="form-item">
              <IonLabel position="stacked">Landmark (Optional)</IonLabel>
              <IonInput
                value={landmark}
                placeholder="e.g., Near Park"
                onIonInput={(e) => setLandmark(e.detail.value || "")}
                disabled={loading}
              />
            </IonItem>

            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={loading}
              className="submit-button"
            >
              {loading ? "Saving..." : "Continue to Home"}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Onboarding;

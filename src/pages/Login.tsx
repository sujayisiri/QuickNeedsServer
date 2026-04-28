import { useState, useEffect } from "react";
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonText,
  IonIcon,
  IonSpinner,
  IonItem,
  useIonToast,
} from "@ionic/react";
import { phonePortraitOutline, keyOutline } from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useAuth, UserRole } from "../contexts/AuthContext";
import { API_ENDPOINTS } from "../config/api";
import "./Login.css";

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [present] = useIonToast();
  const history = useHistory();
  const { isAuthenticated, role, login } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      const profileComplete =
        localStorage.getItem("profileComplete") === "true";

      // If user hasn't completed profile, redirect to onboarding
      if (!profileComplete && role === "user") {
        history.replace("/onboarding");
      } else {
        const redirectPath = role === "admin" ? "/admin" : "/tabs/home";
        history.replace(redirectPath);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, role]);

  const validatePhoneNumber = (phone: string): boolean => {
    // Basic validation: should be 10 digits (adjust based on your region)
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ""));
  };

  const handleSendOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      present({
        message: "Please enter a valid 10-digit phone number",
        duration: 2000,
        color: "danger",
        position: "top",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.auth.sendOtp, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setLoading(false);
      setStep("otp");
      present({
        message: "OTP sent successfully!",
        duration: 2000,
        color: "success",
        position: "top",
      });

      // In dev mode, log OTP for testing
      if (data.otp) {
        console.log("OTP for testing:", data.otp);
      }
    } catch (error: unknown) {
      setLoading(false);
      present({
        message:
          (error as Error).message || "Failed to send OTP. Please try again.",
        duration: 3000,
        color: "danger",
        position: "top",
      });
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      present({
        message: "Please enter a valid 6-digit OTP",
        duration: 2000,
        color: "danger",
        position: "top",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.auth.verifyOtp, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      setLoading(false);

      // Backend returns nested data: { success: true, data: { token, user } }
      const responseData = data.data;
      const userRole = responseData.user?.role || "user";
      const token = responseData.token;
      const userName = responseData.user?.name;

      // On successful login, set authentication state with role and token
      login(phoneNumber, userRole as UserRole, token);

      // Check if profile is complete (name exists)
      const isProfileComplete = !!userName;

      if (!isProfileComplete && userRole === "user") {
        // First-time user, redirect to onboarding
        localStorage.setItem("profileComplete", "false");
        history.replace("/onboarding");
      } else {
        // Profile complete or admin, mark as complete
        localStorage.setItem("profileComplete", "true");
      }

      present({
        message: "Login successful!",
        duration: 2000,
        color: "success",
        position: "top",
      });
      // useEffect will automatically redirect based on role (unless we already redirected to onboarding)
    } catch (error: unknown) {
      setLoading(false);
      present({
        message: (error as Error).message || "Invalid OTP. Please try again.",
        duration: 3000,
        color: "danger",
        position: "top",
      });
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.auth.sendOtp, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setLoading(false);
      present({
        message: "OTP resent successfully!",
        duration: 2000,
        color: "success",
        position: "top",
      });

      // In dev mode, log OTP for testing
      if (data.otp) {
        console.log("OTP for testing:", data.otp);
      }
    } catch (error: unknown) {
      setLoading(false);
      present({
        message: (error as Error).message || "Failed to resend OTP",
        duration: 3000,
        color: "danger",
        position: "top",
      });
    }
  };

  const handleChangeNumber = () => {
    setStep("phone");
    setOtp("");
  };

  return (
    <IonPage>
      <IonContent className="ion-padding" fullscreen>
        <div className="login-container">
          <div className="login-header">
            <div className="logo-container">
              <IonIcon icon={phonePortraitOutline} className="logo-icon" />
            </div>
            <IonText>
              <h1>Sign In</h1>
              <p className="subtitle">
                {step === "phone"
                  ? "Enter your phone number to get started"
                  : "Enter the OTP sent to your phone"}
              </p>
            </IonText>
          </div>

          <div className="login-form">
            {step === "phone" ? (
              <>
                <IonItem className="input-item" lines="none">
                  <IonIcon icon={phonePortraitOutline} slot="start" />
                  <IonInput
                    type="tel"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onIonInput={(e) => setPhoneNumber(e.detail.value!)}
                    maxlength={10}
                    inputmode="numeric"
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  color="tertiary"
                  onClick={handleSendOTP}
                  disabled={loading || phoneNumber.length < 10}
                  className="action-button"
                >
                  {loading ? <IonSpinner name="crescent" /> : "Send OTP"}
                </IonButton>
              </>
            ) : (
              <>
                <div className="phone-display">
                  <IonText>
                    <p>
                      Sending OTP to <strong>{phoneNumber}</strong>
                    </p>
                  </IonText>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={handleChangeNumber}
                  >
                    Change Number
                  </IonButton>
                </div>

                <IonItem className="input-item" lines="none">
                  <IonIcon icon={keyOutline} slot="start" />
                  <IonInput
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onIonInput={(e) => setOtp(e.detail.value!)}
                    maxlength={6}
                    inputmode="numeric"
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  color="tertiary"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length < 6}
                  className="action-button"
                >
                  {loading ? <IonSpinner name="crescent" /> : "Verify OTP"}
                </IonButton>

                <div className="resend-container">
                  <IonText color="medium">
                    <p>Didn't receive the code?</p>
                  </IonText>
                  <IonButton fill="clear" onClick={handleResendOTP}>
                    Resend OTP
                  </IonButton>
                </div>
              </>
            )}
          </div>

          <div className="login-footer">
            <IonText color="medium">
              <p>
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;

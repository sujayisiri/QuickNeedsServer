import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonButton,
  IonIcon,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { search } from "ionicons/icons";
import { categories, categorySections } from "../data/products";
import "./Categories.css";

const Categories: React.FC = () => {
  const history = useHistory();

  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    // TODO: Navigate to products page filtered by category
    console.log(`Clicked on ${categoryName}`);
    // For now, we can show a message or navigate to home
    // In future, you can create a CategoryProducts page
  };

  const handleSearch = () => {
    // TODO: Implement search functionality
    console.log("Search clicked");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>All Categories</IonTitle>
          <IonButton slot="end" fill="clear" onClick={handleSearch}>
            <IonIcon icon={search} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="categories-content">
        <div className="categories-container">
          {categorySections.map((section) => (
            <div key={section} className="category-section">
              <div className="section-header">
                <IonText>
                  <h2>{section}</h2>
                </IonText>
              </div>
              <IonGrid>
                <IonRow>
                  {categories
                    .filter((cat) => cat.section === section)
                    .map((category) => (
                      <IonCol size="6" sizeMd="4" sizeLg="3" key={category.id}>
                        <IonCard
                          className="category-card"
                          onClick={() =>
                            handleCategoryClick(category.id, category.name)
                          }
                          button
                        >
                          <IonCardContent>
                            <div className="category-icon">
                              <span>{category.icon}</span>
                            </div>
                            <div className="category-name">
                              <IonText>
                                <h3>{category.name}</h3>
                              </IonText>
                            </div>
                            <div className="category-description">
                              <IonText color="medium">
                                <p>{category.description}</p>
                              </IonText>
                            </div>
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    ))}
                </IonRow>
              </IonGrid>
            </div>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Categories;

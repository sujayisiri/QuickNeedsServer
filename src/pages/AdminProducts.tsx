import { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonButton,
  IonModal,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonAlert,
  IonCard,
  IonCardContent,
  IonSearchbar,
  IonBadge,
} from "@ionic/react";
import { add, barcodeOutline, trash, create } from "ionicons/icons";
import { useProducts } from "../contexts/ProductsContext";
import { Product } from "../contexts/CartContext";
import { BarcodeScanner } from "@capacitor-community/barcode-scanner";
import "./AdminProducts.css";

const AdminProducts: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    unit: "kg",
    image: "",
    description: "",
  });

  const categories = [
    "Vegetables",
    "Fruits",
    "Dairy",
    "Bakery",
    "Beverages",
    "Snacks",
    "Personal Care",
    "Household",
  ];

  const units = ["kg", "g", "l", "ml", "pcs", "dozen"];

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      category: "",
      unit: "kg",
      image: "",
      description: "",
    });
    setEditingProduct(null);
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        unit: product.unit,
        image: product.image,
        description: product.description || "",
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      return;
    }

    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        unit: formData.unit,
        image: formData.image || "📦",
        description: formData.description,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
      } else {
        await addProduct(productData);
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving product:", error);
      // You could show a toast notification here
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete);
        setProductToDelete(null);
      } catch (error) {
        console.error("Error deleting product:", error);
        // You could show a toast notification here
      }
    }
  };

  const startBarcodeScanner = async () => {
    try {
      // Check camera permission
      const status = await BarcodeScanner.checkPermission({ force: true });

      if (!status.granted) {
        return;
      }

      // Make background transparent
      document.body.classList.add("scanner-active");
      setIsScanning(true);

      const result = await BarcodeScanner.startScan();

      // Stop scanning
      document.body.classList.remove("scanner-active");
      setIsScanning(false);

      if (result.hasContent) {
        // In a real app, you'd fetch product details from a barcode API
        // For now, we'll just pre-fill the barcode as product name
        setFormData({
          ...formData,
          name: `Product ${result.content}`,
          description: `Barcode: ${result.content}`,
        });
        setShowModal(true);
      }
    } catch (err) {
      console.error("Barcode scan error:", err);
      document.body.classList.remove("scanner-active");
      setIsScanning(false);
    }
  };

  const stopBarcodeScanner = () => {
    BarcodeScanner.stopScan();
    document.body.classList.remove("scanner-active");
    setIsScanning(false);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Products</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Products</IonTitle>
          </IonToolbar>
        </IonHeader>

        {isScanning && (
          <div className="scanner-overlay">
            <div className="scanner-ui">
              <div className="scanner-frame"></div>
              <p className="scanner-text">Scan a barcode</p>
              <IonButton onClick={stopBarcodeScanner} color="danger">
                Cancel
              </IonButton>
            </div>
          </div>
        )}

        <div className="admin-products-container">
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Search products"
          />

          <div className="products-header">
            <IonBadge color="primary" className="products-count">
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1 ? "Product" : "Products"}
            </IonBadge>
          </div>

          <div className="products-grid">
            {filteredProducts.map((product) => (
              <IonCard key={product.id} className="product-card">
                <div className="product-card-image">{product.image}</div>
                <IonCardContent className="product-card-content">
                  <div className="product-card-header">
                    <h3 className="product-card-name">{product.name}</h3>
                    <IonBadge color="tertiary" className="product-category">
                      {product.category}
                    </IonBadge>
                  </div>

                  {product.description && (
                    <p className="product-card-description">
                      {product.description}
                    </p>
                  )}

                  <div className="product-card-price">
                    <span className="price-amount">₹{product.price}</span>
                    <span className="price-unit">/{product.unit}</span>
                  </div>

                  <div className="product-card-actions">
                    <IonButton
                      expand="block"
                      fill="outline"
                      size="small"
                      onClick={() => handleOpenModal(product)}
                    >
                      <IonIcon icon={create} slot="start" />
                      Edit
                    </IonButton>
                    <IonButton
                      expand="block"
                      fill="outline"
                      size="small"
                      color="danger"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <IonIcon icon={trash} slot="start" />
                      Delete
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="no-products">
              <p>No products found</p>
            </div>
          )}
        </div>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => handleOpenModal()}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={showModal} onDidDismiss={handleCloseModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>
                {editingProduct ? "Edit Product" : "Add Product"}
              </IonTitle>
              <IonButton slot="end" onClick={handleCloseModal}>
                Close
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <div className="product-form">
              {!editingProduct && (
                <IonButton
                  expand="block"
                  onClick={startBarcodeScanner}
                  className="barcode-button"
                >
                  <IonIcon icon={barcodeOutline} slot="start" />
                  Scan Barcode
                </IonButton>
              )}

              <IonItem>
                <IonLabel position="stacked">Product Name *</IonLabel>
                <IonInput
                  value={formData.name}
                  onIonInput={(e) =>
                    setFormData({ ...formData, name: e.detail.value! })
                  }
                  placeholder="Enter product name"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Price *</IonLabel>
                <IonInput
                  type="number"
                  value={formData.price}
                  onIonInput={(e) =>
                    setFormData({ ...formData, price: e.detail.value! })
                  }
                  placeholder="Enter price"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Category *</IonLabel>
                <IonSelect
                  value={formData.category}
                  onIonChange={(e) =>
                    setFormData({ ...formData, category: e.detail.value })
                  }
                  placeholder="Select category"
                >
                  {categories.map((cat) => (
                    <IonSelectOption key={cat} value={cat}>
                      {cat}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Unit</IonLabel>
                <IonSelect
                  value={formData.unit}
                  onIonChange={(e) =>
                    setFormData({ ...formData, unit: e.detail.value })
                  }
                >
                  {units.map((unit) => (
                    <IonSelectOption key={unit} value={unit}>
                      {unit}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Image (Emoji)</IonLabel>
                <IonInput
                  value={formData.image}
                  onIonInput={(e) =>
                    setFormData({ ...formData, image: e.detail.value! })
                  }
                  placeholder="Enter emoji 🍎"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Description</IonLabel>
                <IonTextarea
                  value={formData.description}
                  onIonInput={(e) =>
                    setFormData({ ...formData, description: e.detail.value! })
                  }
                  placeholder="Enter product description"
                  rows={3}
                />
              </IonItem>

              <IonButton
                expand="block"
                onClick={handleSaveProduct}
                disabled={
                  !formData.name || !formData.price || !formData.category
                }
              >
                {editingProduct ? "Update Product" : "Add Product"}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete Product"
          message="Are you sure you want to delete this product?"
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
            },
            {
              text: "Delete",
              role: "confirm",
              handler: confirmDelete,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminProducts;

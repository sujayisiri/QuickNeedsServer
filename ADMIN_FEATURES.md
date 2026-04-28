# QuickNeeds - Role-Based Admin Features

## Overview

The app now supports role-based access with separate interfaces for Users and Admins.

## Features Implemented

### 1. **Role-Based Authentication**

- Login page now includes role selection (User/Admin)
- Upon successful authentication, users are redirected based on their role:
  - **User** → `/tabs/home` (User interface)
  - **Admin** → `/admin/dashboard` (Admin interface)

### 2. **Admin Dashboard** (`/admin/dashboard`)

- **Statistics Cards:**
  - Total Orders
  - Pending Orders
  - Completed Orders
  - Total Products
- **Revenue Display:** Shows total revenue from completed orders
- **Recent Activity:** Lists the 5 most recent orders with status

### 3. **Admin Products Management** (`/admin/products`)

- **View all products** with search functionality
- **Add new products** with the following fields:
  - Product Name
  - Price
  - Category (dropdown)
  - Unit (kg, g, l, ml, pcs, dozen)
  - Image (emoji)
  - Description
- **Barcode Scanning:** Click "Scan Barcode" to open the camera and scan product barcodes
  - Uses `@capacitor-community/barcode-scanner` plugin
  - Pre-fills product information based on barcode scan
  - Note: Requires native device with camera (won't work in browser)
- **Edit existing products**
- **Delete products** with confirmation

### 4. **Admin Orders Management** (`/admin/orders`)

- **View all orders** with filtering by status:
  - All Orders
  - Pending
  - Accepted
  - Delivered
- **Order Actions:**
  - Accept pending orders
  - Mark accepted orders as delivered
  - View detailed order information (customer, items, total)
- **Order Details Modal:** Shows complete order information including all items

### 5. **Updated User Flow**

- Users can add products to cart
- **Place orders** through the cart checkout
- Orders are created with status "pending" and sent to admin

## New Contexts

### OrdersContext

Manages all orders in the application:

- `addOrder()` - Create new orders
- `updateOrderStatus()` - Update order status (pending → accepted → delivered)
- `getOrdersByUser()` - Get orders for a specific user
- `getAllOrders()` - Get all orders (admin view)
- `getPendingOrdersCount()` - Get count of pending orders

### ProductsContext

Manages product catalog (initially loaded from static data):

- `addProduct()` - Add new products
- `updateProduct()` - Edit existing products
- `deleteProduct()` - Remove products
- `getProductById()` - Get specific product
- `getTotalProductsCount()` - Get total product count

## Navigation

### User Navigation (Bottom Tabs)

- 🏠 Home
- 📋 Categories
- 🛒 Cart (with badge showing item count)
- 👤 Account

### Admin Navigation (Bottom Tabs)

- 📊 Dashboard
- 📦 Products
- 🧾 Orders (with badge showing pending orders count)
- 👤 Account

## How to Test

### Testing Admin Features:

1. **Login as Admin:**
   - Open the app
   - Select "Admin" role in the login page
   - Enter any 10-digit phone number (e.g., 9876543210)
   - Enter any 6-digit OTP (e.g., 123456)
   - You'll be redirected to the Admin Dashboard

2. **Test Dashboard:**
   - View statistics (will show 0 initially)
   - Statistics will update as you add products and receive orders

3. **Test Products Management:**
   - Click on "Products" tab
   - Click the "+" button to add a new product
   - Fill in product details or use "Scan Barcode" (requires native device)
   - Click "Add Product"
   - Edit or delete products using the icons next to each product

4. **Test Orders Management:**
   - Switch to User role (logout and login as user)
   - Add products to cart and place an order
   - Switch back to Admin
   - Go to "Orders" tab
   - You'll see the order in "Pending" status
   - Click "Accept" to change status
   - Click "Mark Delivered" when order is complete

### Testing User Features:

1. **Login as User:**
   - Select "User" role in the login page
   - Complete login flow
   - You'll be redirected to the User Home page

2. **Place an Order:**
   - Browse products on Home page
   - Add items to cart
   - Go to Cart tab
   - Review items and click "Checkout"
   - Order will be created and sent to admin

## Technical Details

### Data Storage

- Currently using **in-memory storage** (state management)
- Data persists during the session but resets on app reload
- Cart data is persisted in localStorage
- Ready for backend integration - just replace context methods with API calls

### Barcode Scanner

- Installed: `@capacitor-community/barcode-scanner`
- Requires camera permissions
- Works on native devices (iOS/Android)
- For web testing, the scanner button will show but requires building and running on a device

### Role-Based Routing

- `ProtectedRoute` component enforces role-based access
- Automatic redirection if user tries to access wrong interface
- Separate route structures for `/tabs/*` (user) and `/admin/*` (admin)

## Future Backend Integration

When integrating with backend:

1. **AuthContext:**
   - Replace mock login with actual API call
   - Backend should return user role in login response
   - Update `login()` method to receive role from API

2. **OrdersContext:**
   - Replace state management with API calls
   - Implement real-time order updates (WebSocket/polling)
   - Add order history and tracking

3. **ProductsContext:**
   - Sync products with backend database
   - Implement image upload for products
   - Integrate with barcode API for product lookup

4. **Barcode Scanner:**
   - Connect to barcode lookup API (e.g., UPC Database API)
   - Auto-populate product details from barcode data

## Files Created/Modified

### New Files:

- `src/contexts/OrdersContext.tsx`
- `src/contexts/ProductsContext.tsx`
- `src/pages/AdminDashboard.tsx` + `.css`
- `src/pages/AdminProducts.tsx` + `.css`
- `src/pages/AdminOrders.tsx` + `.css`
- `src/components/AdminTabBar.tsx`

### Modified Files:

- `src/contexts/AuthContext.tsx` - Added role support
- `src/components/ProtectedRoute.tsx` - Role-based routing
- `src/pages/Login.tsx` + `.css` - Role selection UI
- `src/pages/Home.tsx` - Use ProductsContext
- `src/pages/Cart.tsx` - Order placement integration
- `src/App.tsx` - Admin routes and providers

## Dependencies Added

- `@capacitor-community/barcode-scanner` - For barcode scanning functionality

## Notes

- Admin and User interfaces are completely separate
- All admin pages have consistent styling with the rest of the app
- Orders flow: User places order → Admin sees in pending → Admin accepts → Admin marks delivered
- Products added by admin are immediately available to users
- The barcode scanner UI includes a visual frame and cancel button

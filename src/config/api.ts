/**
 * API Configuration
 *
 * To change the backend URL:
 * 1. Update API_BASE_URL below
 * 2. All endpoints will automatically use the new URL
 *
 * Environments:
 * - Development: https://p4s2fjfozi.execute-api.ap-south-2.amazonaws.com/dev
 * - Production: Update this when you deploy prod stage
 */

// Base URL - Change this to switch environments
export const API_BASE_URL =
  "https://p4s2fjfozi.execute-api.ap-south-2.amazonaws.com/dev";

// All API Endpoints - Automatically use API_BASE_URL
export const API_ENDPOINTS = {
  auth: {
    sendOtp: `${API_BASE_URL}/auth/send-otp`,
    verifyOtp: `${API_BASE_URL}/auth/verify-otp`,
  },
  users: {
    profile: `${API_BASE_URL}/users/profile`,
    updateProfile: `${API_BASE_URL}/users/profile`,
  },
  products: {
    list: `${API_BASE_URL}/products`,
    get: (id: string) => `${API_BASE_URL}/products/${id}`,
    create: `${API_BASE_URL}/products`,
    update: (id: string) => `${API_BASE_URL}/products/${id}`,
    delete: (id: string) => `${API_BASE_URL}/products/${id}`,
  },
  orders: {
    list: `${API_BASE_URL}/orders`,
    get: (id: string) => `${API_BASE_URL}/orders/${id}`,
    create: `${API_BASE_URL}/orders`,
    updateStatus: (id: string) => `${API_BASE_URL}/orders/${id}/status`,
  },
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

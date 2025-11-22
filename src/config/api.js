// API Base URL
const API_BASE_URL = 'http://localhost:5238/api';

// API Endpoints
export const API_ENDPOINTS = {
  // Setup - Thiết lập ban đầu
  units: `${API_BASE_URL}/units`,
  productCategories: `${API_BASE_URL}/productcategories`,
  customerGroups: `${API_BASE_URL}/customergroups`,
  transactionContents: `${API_BASE_URL}/transactioncontents`,
  accountFunds: `${API_BASE_URL}/accountfunds`,
  companyInfos: `${API_BASE_URL}/companyinfos`,
  bankLoans: `${API_BASE_URL}/bankloans`,
  
  // Main - Danh mục chính
  products: `${API_BASE_URL}/products`,
  customers: `${API_BASE_URL}/customers`,
  suppliers: `${API_BASE_URL}/suppliers`,
  warehouses: `${API_BASE_URL}/warehouses`,
  vehicles: `${API_BASE_URL}/vehicles`,
  orders: `${API_BASE_URL}/orders`,
  geocoding: `${API_BASE_URL}/geocoding`,
};

// API Helper functions
export const api = {
  // GET request
  get: async (endpoint) => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  },

  // POST request
  post: async (endpoint, data) => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  },

  // PUT request
  put: async (endpoint, id, data) => {
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.ok;
    } catch (error) {
      console.error('API PUT Error:', error);
      throw error;
    }
  },

  // DELETE request
  delete: async (endpoint, id) => {
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.ok;
    } catch (error) {
      console.error('API DELETE Error:', error);
      throw error;
    }
  },
};

export default api;

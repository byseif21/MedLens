import apiClient from './axios';

/**
 * Face Login - Validate face and authenticate
 * @param {FormData} formData - Form data containing face image
 * @returns {Promise} API response with user data
 */
export const loginWithFace = async (formData) => {
  try {
    const response = await apiClient.post('/api/login/face', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'Login failed',
    };
  }
};

export const confirmFaceLogin = async ({ userId, password }) => {
  try {
    const response = await apiClient.post(
      '/api/login/face/confirm',
      {
        user_id: userId,
        password,
      },
      {
        skipAuthRedirect: true,
      }
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'Login failed',
    };
  }
};

/**
 * Register a new user with face image
 * @param {FormData} formData - Form data containing name, age, nationality, etc.
 * @returns {Promise} API response
 */
export const registerUser = async (formData) => {
  try {
    const response = await apiClient.post('/api/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Registration failed',
    };
  }
};

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @returns {Promise} API response with profile data
 */
export const getProfile = async (userId) => {
  try {
    const response = await apiClient.get(`/api/profile/${userId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch profile',
    };
  }
};

/**
 * Update main info
 * @param {string} userId - User ID
 * @param {Object} data - Main info data
 * @returns {Promise} API response
 */
export const updateMainInfo = async (userId, data) => {
  try {
    const response = await apiClient.put(`/api/profile/main-info/${userId}`, data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to update main info',
    };
  }
};

/**
 * Update medical info
 * @param {string} userId - User ID
 * @param {Object} data - Medical info data
 * @returns {Promise} API response
 */
export const updateMedicalInfo = async (userId, data) => {
  try {
    const response = await apiClient.put(`/api/profile/medical-info/${userId}`, data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to update medical info',
    };
  }
};

/**
 * Update relatives/connections
 * @param {string} userId - User ID
 * @param {Array} relatives - Array of relative objects
 * @returns {Promise} API response
 */
export const updateRelatives = async (userId, relatives) => {
  try {
    const response = await apiClient.put(`/api/profile/relatives/${userId}`, { relatives });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to update relatives',
    };
  }
};

/**
 * Recognize a person from face image
 * @param {FormData} formData - Form data containing image
 * @returns {Promise} API response
 */
export const recognizeFace = async (formData) => {
  try {
    const response = await apiClient.post('/api/recognize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Recognition failed',
    };
  }
};

/**
 * Health check endpoint
 * @returns {Promise} API response
 */
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Health check failed',
    };
  }
};

/**
 * Search for users by name or ID
 * @param {string} query - Search query
 * @returns {Promise} API response with matching users
 */
export const searchUsers = async (query) => {
  try {
    const response = await apiClient.get(`/api/users/search?q=${encodeURIComponent(query)}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Search failed',
    };
  }
};

/**
 * Get all connections for a user (linked and external)
 * @param {string} userId - User ID
 * @returns {Promise} API response with connections
 */
export const getConnections = async (userId) => {
  try {
    const response = await apiClient.get(`/api/connections/${userId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to fetch connections',
    };
  }
};

/**
 * Create a linked connection to another user
 * @param {Object} data - Connection data {connected_user_id, relationship}
 * @returns {Promise} API response
 */
export const createLinkedConnection = async (data) => {
  try {
    const response = await apiClient.post('/api/connections/linked', data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to create connection',
    };
  }
};

/**
 * Create an external contact
 * @param {Object} data - Contact data {name, phone, address, relationship}
 * @returns {Promise} API response
 */
export const createExternalContact = async (data) => {
  try {
    const response = await apiClient.post('/api/connections/external', data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to create contact',
    };
  }
};

/**
 * Update a connection
 * @param {string} connectionId - Connection ID
 * @param {Object} data - Updated data
 * @returns {Promise} API response
 */
export const updateConnection = async (connectionId, data, connectionType) => {
  try {
    const type = connectionType || 'external';
    const endpoint =
      type === 'linked'
        ? `/api/connections/linked/${connectionId}`
        : `/api/connections/external/${connectionId}`;

    const response = await apiClient.put(endpoint, data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.response?.data?.error ||
        error.message ||
        'Failed to update connection',
    };
  }
};

/**
 * Delete a connection
 * @param {string} connectionId - Connection ID
 * @returns {Promise} API response
 */
export const deleteConnection = async (connectionId) => {
  try {
    const response = await apiClient.delete(`/api/connections/${connectionId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to delete connection',
    };
  }
};

export default apiClient;

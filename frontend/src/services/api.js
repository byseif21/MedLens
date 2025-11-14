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
      error: error.response?.data?.error || error.message || 'Login failed',
    };
  }
};

/**
 * Register a new person with face image
 * @param {FormData} formData - Form data containing name, age, nationality, etc.
 * @returns {Promise} API response
 */
export const registerPerson = async (formData) => {
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

export default apiClient;

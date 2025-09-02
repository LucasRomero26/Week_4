// src/models/ApiClient.js
import axios from 'axios';
import config from '../config';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (requestConfig) => {
        console.log(`������ API Request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
        return requestConfig;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('❌ API Response Error:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        });

        // Manejar errores específicos
        if (error.response?.status === 404) {
          throw new Error('Recurso no encontrado');
        } else if (error.response?.status === 500) {
          throw new Error('Error interno del servidor');
        } else if (error.code === 'NETWORK_ERROR' || !error.response) {
          throw new Error('Error de conexión con el servidor');
        }

        throw error;
      }
    );
  }

  // Método genérico para GET
  async get(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Método genérico para POST
  async post(endpoint, data = {}) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Método genérico para PUT
  async put(endpoint, data = {}) {
    try {
      const response = await this.client.put(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Método genérico para DELETE
  async delete(endpoint) {
    try {
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Manejo centralizado de errores
  handleError(error) {
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Error desconocido';
    
    const errorObj = {
      message: errorMessage,
      status: error.response?.status || 0,
      data: error.response?.data || null,
      timestamp: new Date().toISOString()
    };

    console.error('������ ApiClient Error:', errorObj);
    return errorObj;
  }

  // Verificar estado del servidor
  async checkHealth() {
    try {
      const response = await this.get(config.API_ENDPOINTS.HEALTH);
      return {
        isHealthy: response.status === 'OK',
        data: response
      };
    } catch (error) {
      return {
        isHealthy: false,
        error: this.handleError(error)
      };
    }
  }

  // Obtener información de configuración del cliente
  getConfig() {
    return {
      baseURL: config.API_BASE_URL,
      timeout: this.client.defaults.timeout,
      endpoints: config.API_ENDPOINTS
    };
  }
}

// Crear instancia singleton
const apiClient = new ApiClient();

export default apiClient;
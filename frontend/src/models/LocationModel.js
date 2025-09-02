// src/models/LocationModel.js
import apiClient from './ApiClient';
import config from '../config';

class LocationModel {
  
  // Obtener todas las ubicaciones
  static async getAll(limit = 50, offset = 0) {
    try {
      const response = await apiClient.get(config.API_ENDPOINTS.LOCATIONS, {
        limit,
        offset
      });
      
      if (response.success) {
        return {
          success: true,
          locations: response.data.map(this.formatLocation),
          pagination: response.pagination
        };
      } else {
        throw new Error(response.message || 'Error al obtener ubicaciones');
      }
    } catch (error) {
      console.error('Error en LocationModel.getAll:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión',
        locations: [],
        pagination: null
      };
    }
  }

  // Obtener la ubicación más reciente
  static async getLatest() {
    try {
      const response = await apiClient.get(config.API_ENDPOINTS.LATEST);
      
      if (response.success) {
        return {
          success: true,
          location: this.formatLocation(response.data)
        };
      } else {
        throw new Error(response.message || 'Error al obtener última ubicación');
      }
    } catch (error) {
      console.error('Error en LocationModel.getLatest:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión',
        location: null
      };
    }
  }

  // Obtener ubicaciones por rango de tiempo
  static async getByTimeRange(startTime, endTime) {
    try {
      const response = await apiClient.get(config.API_ENDPOINTS.RANGE, {
        startTime,
        endTime
      });
      
      if (response.success) {
        return {
          success: true,
          locations: response.data.map(this.formatLocation),
          count: response.count
        };
      } else {
        throw new Error(response.message || 'Error al obtener ubicaciones por rango');
      }
    } catch (error) {
      console.error('Error en LocationModel.getByTimeRange:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión',
        locations: [],
        count: 0
      };
    }
  }

  // Obtener estadísticas
  static async getStats() {
    try {
      const response = await apiClient.get(config.API_ENDPOINTS.STATS);
      
      if (response.success) {
        return {
          success: true,
          stats: response.data
        };
      } else {
        throw new Error(response.message || 'Error al obtener estadísticas');
      }
    } catch (error) {
      console.error('Error en LocationModel.getStats:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión',
        stats: null
      };
    }
  }

  // Formatear datos de ubicación para el frontend
  static formatLocation(rawLocation) {
    if (!rawLocation) return null;

    return {
      id: rawLocation.id,
      latitude: parseFloat(rawLocation.latitude),
      longitude: parseFloat(rawLocation.longitude),
      timestamp: parseInt(rawLocation.timestamp_value),
      createdAt: rawLocation.created_at,
      // Formatear timestamp a fecha legible
      formattedDate: new Date(parseInt(rawLocation.timestamp_value)).toLocaleString(),
      formattedCreatedAt: new Date(rawLocation.created_at).toLocaleString()
    };
  }

  // Validar datos de ubicación
  static validateLocation(location) {
    const errors = [];
    
    if (!location) {
      errors.push('Ubicación no definida');
      return errors;
    }

    if (typeof location.latitude !== 'number' || 
        location.latitude < config.VALIDATION.LAT_MIN || 
        location.latitude > config.VALIDATION.LAT_MAX) {
      errors.push('Latitud inválida');
    }

    if (typeof location.longitude !== 'number' || 
        location.longitude < config.VALIDATION.LON_MIN || 
        location.longitude > config.VALIDATION.LON_MAX) {
      errors.push('Longitud inválida');
    }

    if (typeof location.timestamp !== 'number' || 
        location.timestamp < config.VALIDATION.TIMESTAMP_MIN) {
      errors.push('Timestamp inválido');
    }

    return errors;
  }

  // Obtener la distancia entre dos puntos (fórmula de Haversine)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en kilómetros
  }

  // Convertir grados a radianes
  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Obtener el centro geográfico de un array de ubicaciones
  static getLocationCenter(locations) {
    if (!locations || locations.length === 0) {
      return config.UI_CONFIG.MAP_DEFAULT_CENTER;
    }

    if (locations.length === 1) {
      return [locations[0].latitude, locations[0].longitude];
    }

    const sum = locations.reduce(
      (acc, location) => ({
        lat: acc.lat + location.latitude,
        lon: acc.lon + location.longitude
      }),
      { lat: 0, lon: 0 }
    );

    return [
      sum.lat / locations.length,
      sum.lon / locations.length
    ];
  }

  // Filtrar ubicaciones por criterios
  static filterLocations(locations, filters = {}) {
    if (!locations || locations.length === 0) return [];

    return locations.filter(location => {
      // Filtro por rango de fechas
      if (filters.startDate && filters.endDate) {
        const locationDate = new Date(location.timestamp);
        if (locationDate < filters.startDate || locationDate > filters.endDate) {
          return false;
        }
      }

      // Filtro por área geográfica (bounding box)
      if (filters.bounds) {
        const { north, south, east, west } = filters.bounds;
        if (location.latitude > north || location.latitude < south ||
            location.longitude > east || location.longitude < west) {
          return false;
        }
      }

      return true;
    });
  }

  // Ordenar ubicaciones
  static sortLocations(locations, sortBy = 'timestamp', order = 'desc') {
    if (!locations || locations.length === 0) return [];

    return [...locations].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'latitude':
          comparison = a.latitude - b.latitude;
          break;
        case 'longitude':
          comparison = a.longitude - b.longitude;
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        default:
          comparison = a.timestamp - b.timestamp;
      }

      return order === 'desc' ? -comparison : comparison;
    });
  }
}

export default LocationModel;
// src/controllers/LocationController.js
import LocationModel from '../models/LocationModel';
import { toast } from 'react-hot-toast';

class LocationController {
  
  // Manejar la carga inicial de datos
  static async handleInitialLoad() {
    try {
      const [locationsResult, statsResult] = await Promise.all([
        LocationModel.getAll(50, 0),
        LocationModel.getStats()
      ]);

      return {
        success: true,
        locations: locationsResult.success ? locationsResult.locations : [],
        stats: statsResult.success ? statsResult.stats : null,
        pagination: locationsResult.pagination,
        errors: [
          ...(locationsResult.success ? [] : [locationsResult.error]),
          ...(statsResult.success ? [] : [statsResult.error])
        ].filter(Boolean)
      };
    } catch (error) {
      console.error('Error en carga inicial:', error);
      return {
        success: false,
        locations: [],
        stats: null,
        pagination: null,
        errors: [error.message]
      };
    }
  }

  // Manejar nueva ubicación recibida en tiempo real
  static handleNewLocationReceived(locationData, currentLocations, maxLocations = 50) {
    try {
      // Formatear la nueva ubicación
      const newLocation = LocationModel.formatLocation(locationData);
      
      if (!newLocation) {
        console.warn('Datos de ubicación inválidos');
        return { success: false, locations: currentLocations };
      }

      // Validar la ubicación
      const validationErrors = LocationModel.validateLocation(newLocation);
      if (validationErrors.length > 0) {
        console.warn('Ubicación inválida:', validationErrors);
        toast.error(`Ubicación inválida: ${validationErrors.join(', ')}`);
        return { success: false, locations: currentLocations };
      }

      // Verificar si ya existe (evitar duplicados)
      const existingIndex = currentLocations.findIndex(loc => 
        loc.timestamp === newLocation.timestamp &&
        loc.latitude === newLocation.latitude &&
        loc.longitude === newLocation.longitude
      );

      let updatedLocations;
      
      if (existingIndex >= 0) {
        // Actualizar ubicación existente
        updatedLocations = [...currentLocations];
        updatedLocations[existingIndex] = newLocation;
      } else {
        // Agregar nueva ubicación al principio
        updatedLocations = [newLocation, ...currentLocations];
        
        // Mantener solo el máximo número de ubicaciones
        if (updatedLocations.length > maxLocations) {
          updatedLocations = updatedLocations.slice(0, maxLocations);
        }
      }

      // Ordenar por timestamp descendente
      updatedLocations = LocationModel.sortLocations(updatedLocations, 'timestamp', 'desc');

      return {
        success: true,
        locations: updatedLocations,
        newLocation,
        isNewLocation: existingIndex === -1
      };

    } catch (error) {
      console.error('Error procesando nueva ubicación:', error);
      toast.error('Error procesando nueva ubicación');
      return { success: false, locations: currentLocations };
    }
  }

  // Manejar filtrado de ubicaciones
  static handleLocationFilter(locations, filterCriteria) {
    try {
      const filteredLocations = LocationModel.filterLocations(locations, filterCriteria);
      
      return {
        success: true,
        locations: filteredLocations,
        count: filteredLocations.length,
        criteria: filterCriteria
      };
    } catch (error) {
      console.error('Error filtrando ubicaciones:', error);
      toast.error('Error aplicando filtros');
      return {
        success: false,
        locations,
        count: locations.length,
        error: error.message
      };
    }
  }

  // Manejar ordenamiento de ubicaciones
  static handleLocationSort(locations, sortBy = 'timestamp', order = 'desc') {
    try {
      const sortedLocations = LocationModel.sortLocations(locations, sortBy, order);
      
      return {
        success: true,
        locations: sortedLocations,
        sortBy,
        order
      };
    } catch (error) {
      console.error('Error ordenando ubicaciones:', error);
      toast.error('Error ordenando ubicaciones');
      return {
        success: false,
        locations,
        error: error.message
      };
    }
  }

  // Manejar búsqueda por rango de tiempo
  static async handleTimeRangeSearch(startTime, endTime) {
    try {
      // Validar parámetros
      if (!startTime || !endTime) {
        throw new Error('Fechas de inicio y fin son requeridas');
      }

      if (startTime >= endTime) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
      }

      const result = await LocationModel.getByTimeRange(startTime, endTime);
      
      if (result.success) {
        toast.success(`${result.locations.length} ubicaciones encontradas`);
        return {
          success: true,
          locations: result.locations,
          count: result.count,
          timeRange: { startTime, endTime }
        };
      } else {
        toast.error(result.error);
        return {
          success: false,
          locations: [],
          error: result.error
        };
      }
    } catch (error) {
      console.error('Error en búsqueda por rango de tiempo:', error);
      toast.error(error.message);
      return {
        success: false,
        locations: [],
        error: error.message
      };
    }
  }

  // Manejar carga de más ubicaciones (paginación)
  static async handleLoadMore(currentLocations, pagination) {
    try {
      if (!pagination || !pagination.hasMore) {
        return {
          success: false,
          locations: currentLocations,
          message: 'No hay más ubicaciones para cargar'
        };
      }

      const nextOffset = pagination.offset + pagination.limit;
      const result = await LocationModel.getAll(pagination.limit, nextOffset);
      
      if (result.success) {
        const combinedLocations = [...currentLocations, ...result.locations];
        
        return {
          success: true,
          locations: combinedLocations,
          pagination: result.pagination,
          newCount: result.locations.length
        };
      } else {
        toast.error(result.error);
        return {
          success: false,
          locations: currentLocations,
          error: result.error
        };
      }
    } catch (error) {
      console.error('Error cargando más ubicaciones:', error);
      toast.error('Error cargando más ubicaciones');
      return {
        success: false,
        locations: currentLocations,
        error: error.message
      };
    }
  }

  // Calcular estadísticas de las ubicaciones actuales
  static calculateLocationStats(locations) {
    try {
      if (!locations || locations.length === 0) {
        return {
          total: 0,
          timeRange: null,
          center: null,
          bounds: null,
          avgDistance: 0
        };
      }

      // Rango de tiempo
      const timestamps = locations.map(loc => loc.timestamp);
      const timeRange = {
        start: Math.min(...timestamps),
        end: Math.max(...timestamps),
        duration: Math.max(...timestamps) - Math.min(...timestamps)
      };

      // Centro geográfico
      const center = LocationModel.getLocationCenter(locations);

      // Límites geográficos
      const latitudes = locations.map(loc => loc.latitude);
      const longitudes = locations.map(loc => loc.longitude);
      
      const bounds = {
        north: Math.max(...latitudes),
        south: Math.min(...latitudes),
        east: Math.max(...longitudes),
        west: Math.min(...longitudes)
      };

      // Distancia promedio entre puntos consecutivos
      let totalDistance = 0;
      if (locations.length > 1) {
        for (let i = 1; i < locations.length; i++) {
          const distance = LocationModel.calculateDistance(
            locations[i-1].latitude,
            locations[i-1].longitude,
            locations[i].latitude,
            locations[i].longitude
          );
          totalDistance += distance;
        }
      }
      
      const avgDistance = locations.length > 1 ? 
        totalDistance / (locations.length - 1) : 0;

      return {
        total: locations.length,
        timeRange,
        center,
        bounds,
        avgDistance: Math.round(avgDistance * 1000) / 1000, // Redondear a 3 decimales
        area: {
          width: bounds.east - bounds.west,
          height: bounds.north - bounds.south
        }
      };
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
      return {
        total: locations?.length || 0,
        timeRange: null,
        center: null,
        bounds: null,
        avgDistance: 0,
        error: error.message
      };
    }
  }

  // Validar y preparar ubicación para exportar
  static prepareLocationForExport(location) {
    try {
      const validationErrors = LocationModel.validateLocation(location);
      
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors
        };
      }

      return {
        success: true,
        data: {
          id: location.id,
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp,
          formattedDate: location.formattedDate,
          createdAt: location.createdAt
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  // Manejar errores de conexión
  static handleConnectionError(error, context = '') {
    const errorMessage = error?.message || 'Error de conexión desconocido';
    
    console.error(`Error de conexión${context ? ` en ${context}` : ''}:`, error);
    
    // Mostrar toast con mensaje apropiado
    if (errorMessage.includes('Network Error')) {
      toast.error('Sin conexión al servidor');
    } else if (errorMessage.includes('timeout')) {
      toast.error('Tiempo de espera agotado');
    } else {
      toast.error(errorMessage);
    }

    return {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    };
  }

  // Limpiar y resetear estado
  static resetState() {
    return {
      locations: [],
      latestLocation: null,
      stats: null,
      pagination: null,
      error: null,
      loading: false
    };
  }
}

export default LocationController;
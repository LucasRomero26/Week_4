// src/hooks/useLocationData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import LocationModel from '../models/LocationModel';
import useSocket from './useSocket';
import config from '../config';
import { toast } from 'react-hot-toast';

const useLocationData = (options = {}) => {
  const {
    maxLocations = config.UI_CONFIG.MAX_LOCATIONS_DISPLAY,
    autoFetch = true,
    enableRealTime = true
  } = options;

  // Estados
  const [locations, setLocations] = useState([]);
  const [latestLocation, setLatestLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  
  // Referencias para evitar re-renders innecesarios
  const isInitialized = useRef(false);
  const lastUpdateTime = useRef(Date.now());

  // Hook de WebSocket
  const socket = useSocket();

  // Cargar ubicaciones iniciales
  const fetchLocations = useCallback(async (limit = maxLocations, offset = 0) => {
    try {
      setLoading(true);
      setError(null);

      const result = await LocationModel.getAll(limit, offset);
      
      if (result.success) {
        if (offset === 0) {
          setLocations(result.locations);
        } else {
          setLocations(prev => [...prev, ...result.locations]);
        }
        setPagination(result.pagination);
        
        // Actualizar última ubicación si hay datos
        if (result.locations.length > 0) {
          setLatestLocation(result.locations[0]);
        }
        
        console.log(`������ ${result.locations.length} ubicaciones cargadas`);
        
      } else {
        setError(result.error);
        toast.error(result.error);
      }
      
    } catch (err) {
      const errorMsg = err.message || 'Error al cargar ubicaciones';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Error en fetchLocations:', err);
      
    } finally {
      setLoading(false);
    }
  }, [maxLocations]);

  // Cargar más ubicaciones (paginación)
  const loadMore = useCallback(async () => {
    if (!pagination || !pagination.hasMore || loading) {
      return;
    }

    const nextOffset = pagination.offset + pagination.limit;
    await fetchLocations(pagination.limit, nextOffset);
  }, [pagination, loading, fetchLocations]);

  // Cargar última ubicación
  const fetchLatestLocation = useCallback(async () => {
    try {
      const result = await LocationModel.getLatest();
      
      if (result.success && result.location) {
        setLatestLocation(result.location);
        console.log('������ Última ubicación cargada:', result.location);
      }
      
    } catch (err) {
      console.error('Error cargando última ubicación:', err);
    }
  }, []);

  // Cargar estadísticas
  const fetchStats = useCallback(async () => {
    try {
      const result = await LocationModel.getStats();
      
      if (result.success) {
        setStats(result.stats);
        console.log('������ Estadísticas cargadas:', result.stats);
      }
      
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, []);

  // Refrescar todos los datos
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchLocations(),
      fetchStats()
    ]);
    lastUpdateTime.current = Date.now();
  }, [fetchLocations, fetchStats]);

  // Manejar nueva ubicación en tiempo real
  const handleNewLocation = useCallback((data) => {
    console.log('������ Nueva ubicación en tiempo real:', data);
    
    const newLocation = LocationModel.formatLocation(data.data);
    
    if (!newLocation) {
      console.warn('Datos de ubicación inválidos recibidos');
      return;
    }

    // Validar ubicación
    const validationErrors = LocationModel.validateLocation(newLocation);
    if (validationErrors.length > 0) {
      console.warn('Ubicación inválida:', validationErrors);
      return;
    }

    // Actualizar última ubicación
    setLatestLocation(newLocation);
    
    // Agregar a la lista de ubicaciones (al principio)
    setLocations(prev => {
      const updated = [newLocation, ...prev];
      // Mantener solo el máximo número de ubicaciones
      return updated.slice(0, maxLocations);
    });
    
    // Mostrar notificación toast (opcional)
    if (data.data.latitude && data.data.longitude) {
      toast.success(`Nueva ubicación: ${newLocation.formattedDate}`, {
        duration: 3000,
        position: 'bottom-right'
      });
    }
    
    lastUpdateTime.current = Date.now();
  }, [maxLocations]);

  // Manejar datos iniciales del WebSocket
  const handleInitialData = useCallback((data) => {
    console.log('������ Datos iniciales del WebSocket:', data);
    
    if (data.success && data.data && Array.isArray(data.data)) {
      const formattedLocations = data.data.map(LocationModel.formatLocation).filter(Boolean);
      setLocations(formattedLocations);
      
      if (formattedLocations.length > 0) {
        setLatestLocation(formattedLocations[0]);
      }
      
      console.log(`������ ${formattedLocations.length} ubicaciones iniciales cargadas via WebSocket`);
    }
  }, []);

  // Manejar actualizaciones de estadísticas
  const handleStatsUpdate = useCallback((data) => {
    console.log('������ Estadísticas actualizadas via WebSocket:', data);
    setStats(data);
  }, []);

  // Filtrar ubicaciones
  const filterLocations = useCallback((filters) => {
    return LocationModel.filterLocations(locations, filters);
  }, [locations]);

  // Ordenar ubicaciones
  const sortLocations = useCallback((sortBy, order) => {
    const sorted = LocationModel.sortLocations(locations, sortBy, order);
    setLocations(sorted);
  }, [locations]);

  // Obtener ubicaciones por rango de tiempo
  const getLocationsByTimeRange = useCallback(async (startTime, endTime) => {
    try {
      setLoading(true);
      const result = await LocationModel.getByTimeRange(startTime, endTime);
      
      if (result.success) {
        return result.locations;
      } else {
        toast.error(result.error);
        return [];
      }
      
    } catch (err) {
      console.error('Error obteniendo ubicaciones por rango:', err);
      toast.error('Error al obtener ubicaciones por rango de tiempo');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener centro geográfico de las ubicaciones actuales
  const getLocationsCenter = useCallback(() => {
    return LocationModel.getLocationCenter(locations);
  }, [locations]);

  // Configurar listeners del WebSocket
  useEffect(() => {
    if (!enableRealTime || !socket.isConnected()) return;

    const unsubscribers = [
      socket.subscribe('location-update', handleNewLocation),
      socket.subscribe('initial-data', handleInitialData),
      socket.subscribe('stats-update', handleStatsUpdate)
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [enableRealTime, socket, handleNewLocation, handleInitialData, handleStatsUpdate]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!autoFetch || isInitialized.current) return;
    
    isInitialized.current = true;
    console.log('������ Inicializando datos de ubicación...');
    
    // Cargar datos iniciales
    refresh();
    
    // Configurar auto-refresh cada cierto tiempo
    const refreshInterval = setInterval(() => {
      if (!socket.isConnected()) {
        console.log('������ Refrescando datos (sin WebSocket)...');
        refresh();
      }
    }, config.UI_CONFIG.REFRESH_INTERVAL);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [autoFetch, refresh, socket]);

  // Solicitar datos iniciales cuando se conecte el WebSocket
  useEffect(() => {
    if (socket.connectionStatus === 'connected' && enableRealTime) {
      console.log('������ WebSocket conectado, solicitando datos iniciales...');
      socket.requestInitialData();
      socket.requestStats();
    }
  }, [socket.connectionStatus, enableRealTime, socket]);

  // Estados derivados
  const hasLocations = locations.length > 0;
  const hasMore = pagination?.hasMore || false;
  const totalCount = stats?.totalRecords || locations.length;
  const isRealTimeActive = enableRealTime && socket.isConnected();
  const lastUpdate = lastUpdateTime.current;

  // Estadísticas calculadas
  const calculatedStats = {
    total: locations.length,
    latest: latestLocation,
    timeRange: locations.length > 0 ? {
      start: Math.min(...locations.map(l => l.timestamp)),
      end: Math.max(...locations.map(l => l.timestamp))
    } : null,
    center: getLocationsCenter(),
    bounds: locations.length > 0 ? {
      north: Math.max(...locations.map(l => l.latitude)),
      south: Math.min(...locations.map(l => l.latitude)),
      east: Math.max(...locations.map(l => l.longitude)),
      west: Math.min(...locations.map(l => l.longitude))
    } : null
  };

  return {
    // Estados principales
    locations,
    latestLocation,
    loading,
    error,
    stats,
    pagination,

    // Métodos de datos
    fetchLocations,
    fetchLatestLocation,
    fetchStats,
    refresh,
    loadMore,
    getLocationsByTimeRange,

    // Métodos de manipulación
    filterLocations,
    sortLocations,
    getLocationsCenter,

    // Estados derivados
    hasLocations,
    hasMore,
    totalCount,
    isRealTimeActive,
    lastUpdate,
    calculatedStats,

    // Estados de WebSocket
    socketStatus: socket.connectionStatus,
    socketError: socket.error,
    clientCount: socket.clientCount
  };
};

export default useLocationData;
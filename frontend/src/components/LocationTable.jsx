// src/components/LocationTable.jsx
import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Clock, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Eye,
  Download,
  Filter,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const LocationTable = ({ 
  locations = [], 
  loading = false, 
  onLocationClick,
  onExport,
  className = '' 
}) => {
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: '', end: '' },
    coordinates: { lat: '', lon: '' }
  });

  // Función para ordenar
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField, sortDirection]);

  // Renderizar icono de ordenamiento
  const renderSortIcon = useCallback((field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-4 h-4 text-blue-600" /> : 
      <ArrowDown className="w-4 h-4 text-blue-600" />;
  }, [sortField, sortDirection]);

  // Datos ordenados
  const sortedLocations = useMemo(() => {
    if (!locations || locations.length === 0) return [];

    return [...locations].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'latitude':
          aValue = a.latitude;
          bValue = b.latitude;
          break;
        case 'longitude':
          aValue = a.longitude;
          bValue = b.longitude;
          break;
        case 'timestamp':
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
      }
      
      if (sortDirection === 'asc') {
        return aValue - bValue;
      }
      return bValue - aValue;
    });
  }, [locations, sortField, sortDirection]);

  // Formatear coordenadas
  const formatCoordinate = useCallback((coord, type = 'lat') => {
    const abs = Math.abs(coord);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const seconds = Math.round(((abs - degrees) * 60 - minutes) * 60 * 100) / 100;
    
    const direction = type === 'lat' ? 
      (coord >= 0 ? 'N' : 'S') : 
      (coord >= 0 ? 'E' : 'W');
    
    return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
  }, []);

  // Formatear timestamp
  const formatTimestamp = useCallback((timestamp) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  }, []);

  // Manejar clic en ubicación
  const handleLocationClick = useCallback((location) => {
    setSelectedLocation(location);
    onLocationClick?.(location);
  }, [onLocationClick]);

  // Manejar exportación
  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(sortedLocations);
    } else {
      // Exportación básica CSV
      const csvContent = [
        ['ID', 'Latitud', 'Longitud', 'Timestamp', 'Fecha'],
        ...sortedLocations.map(loc => [
          loc.id,
          loc.latitude,
          loc.longitude,
          loc.timestamp,
          formatTimestamp(loc.timestamp)
        ])
      ].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ubicaciones_${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }, [sortedLocations, formatTimestamp, onExport]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!locations || locations.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="p-6 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay ubicaciones disponibles
          </h3>
          <p className="text-gray-500">
            Los datos de ubicación aparecerán aquí cuando se reciban por UDP.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Ubicaciones Recibidas
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {locations.length} ubicación{locations.length !== 1 ? 'es' : ''} 
              {sortField !== 'timestamp' ? '' : ' ordenadas por fecha'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="
                inline-flex items-center gap-2 px-3 py-2 text-sm font-medium
                text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md
                transition-colors duration-200
              "
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            
            <button
              onClick={handleExport}
              className="
                inline-flex items-center gap-2 px-3 py-2 text-sm font-medium
                text-white bg-blue-600 hover:bg-blue-700 rounded-md
                transition-colors duration-200
              "
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Rango de fechas
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={filters.dateRange.start}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                      className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                    />
                    <input
                      type="datetime-local"
                      value={filters.dateRange.end}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                      className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({
                      dateRange: { start: '', end: '' },
                      coordinates: { lat: '', lon: '' }
                    })}
                    className="
                      inline-flex items-center gap-1 px-2 py-1 text-xs
                      text-red-600 hover:text-red-800 transition-colors
                    "
                  >
                    <X className="w-3 h-3" />
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('timestamp')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  <Clock className="w-4 h-4" />
                  Timestamp
                  {renderSortIcon('timestamp')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('latitude')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Latitud
                  {renderSortIcon('latitude')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => handleSort('longitude')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Longitud
                  {renderSortIcon('longitude')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Coordenadas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <AnimatePresence>
              {sortedLocations.map((location, index) => (
                <motion.tr
                  key={location.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`
                    hover:bg-gray-50 transition-colors duration-150
                    ${selectedLocation?.id === location.id ? 'bg-blue-50 ring-1 ring-blue-200' : ''}
                  `}
                >
                  {/* Timestamp */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatTimestamp(location.timestamp)}
                    </div>
                    <div className="text-xs text-gray-500">
                      #{location.id}
                    </div>
                  </td>
                  
                  {/* Latitud */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">
                      {location.latitude.toFixed(6)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCoordinate(location.latitude, 'lat')}
                    </div>
                  </td>
                  
                  {/* Longitud */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">
                      {location.longitude.toFixed(6)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCoordinate(location.longitude, 'lon')}
                    </div>
                  </td>
                  
                  {/* Coordenadas formateadas */}
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono text-gray-700">
                      <div>{formatCoordinate(location.latitude, 'lat')}</div>
                      <div>{formatCoordinate(location.longitude, 'lon')}</div>
                    </div>
                  </td>
                  
                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLocationClick(location)}
                        className="
                          inline-flex items-center gap-1 px-2 py-1 text-xs
                          text-blue-600 hover:text-blue-800 hover:bg-blue-50
                          rounded transition-all duration-150
                        "
                        title="Ver en mapa"
                      >
                        <Eye className="w-3 h-3" />
                        Ver
                      </button>
                      
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${location.latitude}, ${location.longitude}`
                          );
                        }}
                        className="
                          inline-flex items-center gap-1 px-2 py-1 text-xs
                          text-gray-600 hover:text-gray-800 hover:bg-gray-50
                          rounded transition-all duration-150
                        "
                        title="Copiar coordenadas"
                      >
                        <MapPin className="w-3 h-3" />
                        Copiar
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Footer con estadísticas */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            Mostrando {sortedLocations.length} ubicación{sortedLocations.length !== 1 ? 'es' : ''}
          </div>
          
          {sortedLocations.length > 0 && (
            <div className="flex items-center gap-4">
              <div>
                Última actualización: {formatTimestamp(sortedLocations[0].timestamp)}
              </div>
              <div>
                Ordenado por: {sortField === 'timestamp' ? 'Fecha' : sortField === 'latitude' ? 'Latitud' : 'Longitud'} 
                ({sortDirection === 'asc' ? 'Ascendente' : 'Descendente'})
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalles (opcional) */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedLocation(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Detalles de Ubicación</h3>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500">ID</label>
                  <p className="text-sm text-gray-900">#{selectedLocation.id}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500">Timestamp</label>
                  <p className="text-sm text-gray-900">{formatTimestamp(selectedLocation.timestamp)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Latitud</label>
                    <p className="text-sm font-mono text-gray-900">{selectedLocation.latitude.toFixed(6)}</p>
                    <p className="text-xs text-gray-600">{formatCoordinate(selectedLocation.latitude, 'lat')}</p>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Longitud</label>
                    <p className="text-sm font-mono text-gray-900">{selectedLocation.longitude.toFixed(6)}</p>
                    <p className="text-xs text-gray-600">{formatCoordinate(selectedLocation.longitude, 'lon')}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${selectedLocation.latitude}, ${selectedLocation.longitude}`
                      );
                      setSelectedLocation(null);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Copiar Coordenadas
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocationTable;
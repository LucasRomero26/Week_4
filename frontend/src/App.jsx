// src/App.jsx - Versión con Animaciones en los Campos
import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import AnimatedField from './components/AnimatedField';
import './styles/globals.css';

// Configuración básica
const config = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
  APP_NAME: process.env.REACT_APP_APP_NAME || 'Just UDT Location Service Tracker',
  APP_VERSION: '1.0.0'
};

// Hook personalizado para manejar las ubicaciones
function useLocationTracker() {
  const [latestLocation, setLatestLocation] = useState(null);
  const [allLocations, setAllLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalReceived: 0,
    lastUpdateTime: null
  });

  const { 
    isConnected, 
    connectionStatus, 
    error: socketError, 
    clientCount,
    on,
    off 
  } = useSocket();

  // Función para obtener datos iniciales via HTTP
  const fetchInitialData = useCallback(async () => {
    try {
      setError(null);
      console.log('Obteniendo datos iniciales...');
      
      const response = await fetch(`${config.API_BASE_URL}/api/locations/latest`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const location = {
          id: data.data.id,
          latitude: parseFloat(data.data.latitude),
          longitude: parseFloat(data.data.longitude),
          timestamp: parseInt(data.data.timestamp_value),
          created_at: data.data.created_at,
          formattedDate: new Date(parseInt(data.data.timestamp_value)).toLocaleString()
        };
        
        setLatestLocation(location);
        setAllLocations([location]);
        setStats(prev => ({
          ...prev,
          totalReceived: 1,
          lastUpdateTime: Date.now()
        }));
        
        console.log('✅ Datos iniciales cargados:', location);
      } else {
        console.log('ℹ️ No hay datos iniciales disponibles');
        setLatestLocation(null);
        setAllLocations([]);
      }
      
    } catch (err) {
      console.error('❌ Error obteniendo datos iniciales:', err);
      setError(`Error de conexión: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Manejar nuevas ubicaciones recibidas via WebSocket
  const handleLocationUpdate = useCallback((data) => {
    console.log('Nueva ubicación recibida via WebSocket:', data);
    
    if (data.data) {
      const newLocation = {
        id: data.data.id,
        latitude: parseFloat(data.data.latitude),
        longitude: parseFloat(data.data.longitude),
        timestamp: parseInt(data.data.timestamp_value),
        created_at: data.data.created_at,
        formattedDate: new Date(parseInt(data.data.timestamp_value)).toLocaleString()
      };
      
      // Actualizar la ubicación más reciente
      setLatestLocation(newLocation);
      
      // Agregar a la lista de todas las ubicaciones (mantener solo las últimas 20)
      setAllLocations(prev => {
        const updated = [newLocation, ...prev.filter(loc => loc.id !== newLocation.id)];
        return updated.slice(0, 20); // Mantener solo las 20 más recientes
      });
      
      // Actualizar estadísticas
      setStats(prev => ({
        totalReceived: prev.totalReceived + 1,
        lastUpdateTime: Date.now()
      }));
      
      // Limpiar cualquier error previo
      setError(null);
      
      console.log('✅ Ubicación actualizada en el estado local');
    }
  }, []);

  // Manejar datos iniciales recibidos via WebSocket
  const handleInitialData = useCallback((response) => {
    console.log('Datos iniciales via WebSocket:', response);
    
    if (response.success && response.data && response.data.length > 0) {
      const locations = response.data.map(item => ({
        id: item.id,
        latitude: parseFloat(item.latitude),
        longitude: parseFloat(item.longitude),
        timestamp: parseInt(item.timestamp_value),
        created_at: item.created_at,
        formattedDate: new Date(parseInt(item.timestamp_value)).toLocaleString()
      }));
      
      setLatestLocation(locations[0]); // El más reciente
      setAllLocations(locations);
      setStats(prev => ({
        ...prev,
        totalReceived: locations.length,
        lastUpdateTime: Date.now()
      }));
      
      setLoading(false);
      console.log('✅ Datos iniciales procesados via WebSocket');
    } else if (response.success) {
      // Respuesta exitosa pero sin datos
      setLoading(false);
      console.log('ℹ️ No hay datos disponibles via WebSocket');
    } else {
      console.warn('⚠️ Error en datos iniciales via WebSocket:', response.error);
      setError(response.error || 'Error obteniendo datos iniciales');
      setLoading(false);
    }
  }, []);

  // Configurar listeners de WebSocket
  useEffect(() => {
    if (!isConnected) return;

    console.log(' Configurando listeners de WebSocket...');
    
    // Listener para nuevas ubicaciones
    const cleanupLocationUpdate = on('location-update', handleLocationUpdate);
    
    // Listener para datos iniciales
    const cleanupInitialData = on('initial-data', handleInitialData);
    
    return () => {
      console.log('Limpiando listeners de WebSocket...');
      cleanupLocationUpdate();
      cleanupInitialData();
    };
  }, [isConnected, on, handleLocationUpdate, handleInitialData]);

  // Obtener datos iniciales al cargar la página
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Manejar errores de socket
  useEffect(() => {
    if (socketError && !error) {
      setError(`Error de WebSocket: ${socketError}`);
    }
  }, [socketError, error]);

  return {
    latestLocation,
    allLocations,
    loading,
    error,
    stats,
    connectionStatus,
    isConnected,
    clientCount,
    refresh: fetchInitialData
  };
}

// Componente para mostrar el estado de conexión con animación
const ConnectionStatus = ({ status, isConnected, clientCount, lastUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  // Animar cuando cambia el estado
  useEffect(() => {
    setIsUpdating(true);
    const timeout = setTimeout(() => setIsUpdating(false), 500);
    return () => clearTimeout(timeout);
  }, [status, clientCount, lastUpdate]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return '#22c55e';
      case 'connecting': return '#f59e0b';
      case 'disconnected': return '#ef4444';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'disconnected': return 'Desconectado';
      case 'error': return 'Error';
      default: return 'Desconocido';
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '16px',
      padding: '12px 16px',
      backgroundColor: isUpdating ? '#dcfce7' : '#f9fafb',
      borderRadius: '8px',
      border: `1px solid ${isUpdating ? '#22c55e' : '#e5e7eb'}`,
      fontSize: '14px',
      transition: 'all 0.3s ease',
      transform: isUpdating ? 'scale(1.01)' : 'scale(1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: getStatusColor(status),
          border: '2px solid white',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
          animation: status === 'connecting' ? 'pulse 1.5s ease-in-out infinite' : 'none'
        }} />
        <span style={{ fontWeight: '500' }}>
          {getStatusText(status)}
        </span>
      </div>
      
      {isConnected && (
        <>
          <div style={{ color: '#6b7280' }}>
            • {clientCount} cliente{clientCount !== 1 ? 's' : ''} conectado{clientCount !== 1 ? 's' : ''}
          </div>
          {lastUpdate && (
            <div style={{ color: '#6b7280', fontSize: '12px' }}>
              Actualizado: {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          )}
        </>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.1);
            }
          }
        `}
      </style>
    </div>
  );
};

// Componente principal
function App() {
  const {
    latestLocation,
    allLocations,
    loading,
    error,
    stats,
    connectionStatus,
    isConnected,
    clientCount,
    refresh
  } = useLocationTracker();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #f3f4f6', 
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <h1>{config.APP_NAME}</h1>
          <p>Conectando y cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header con animación sutil */}
      <header className="header" style={{ 
        background: 'white',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '1rem 2rem',
        marginBottom: '2rem',
        transition: 'all 0.3s ease'
      }}>
        <div className="container">
          <div style={{ textAlign: 'center'}}>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
              Just UDP Location Services 
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={{ paddingTop: '20px' }}>
        
        {/* Estado de conexión animado */}
        <div style={{ marginBottom: '24px' }}>
          <ConnectionStatus 
            status={connectionStatus}
            isConnected={isConnected}
            clientCount={clientCount}
            lastUpdate={stats.lastUpdateTime}
          />
        </div>

        {/* Datos de ubicación */}
        {error ? (
          <div className="card error" style={{ textAlign: 'center' }}>
            <h2>Error de conexión</h2>
            <p>{error}</p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={refresh} className="btn">
                Reintentar
              </button>
            </div>
          </div>
        ) : latestLocation ? (
          <>
            {/* Ubicación actual con campos animados */}
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto 24px' }}>
              <h2 style={{ 
                textAlign: 'center', 
                marginBottom: '32px', 
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                Última Ubicación Recibida
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Campo de Latitud Animado */}
                <AnimatedField
                  label="Latitud"
                  value={latestLocation.latitude}
                  formatValue={(val) => val.toFixed(6)}
                  animationDuration={2500}
                />

                {/* Campo de Longitud Animado */}
                <AnimatedField
                  label="Longitud"
                  value={latestLocation.longitude}
                  formatValue={(val) => val.toFixed(6)}
                  animationDuration={2500}
                />

                {/* Campo de Timestamp Animado */}
                <AnimatedField
                  label="Timestamp"
                  value={latestLocation.timestamp}
                  formatValue={(val) => val.toString()}
                  subtitle={latestLocation.formattedDate}
                  animationDuration={2500}
                />
              </div>
            </div>

            {/* Historial de ubicaciones recientes con efecto de entrada */}
            {allLocations.length > 1 && (
              <div 
                className="card" 
                style={{ 
                  maxWidth: '800px', 
                  margin: '0 auto',
                  animation: 'fadeInUp 0.5s ease-out'
                }}
              >
                <h3 style={{ 
                  marginBottom: '16px', 
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  Últimas Ubicaciones ({allLocations.length})
                </h3>
                
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ fontSize: '12px' }}>
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Latitud</th>
                        <th>Longitud</th>
                        <th>Fecha/Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allLocations.map((location, index) => (
                        <tr 
                          key={location.id} 
                          style={{ 
                            backgroundColor: index === 0 ? '#f0f9ff' : 'white',
                            fontWeight: index === 0 ? '600' : '400',
                            animation: index === 0 ? 'highlightNew 1s ease-out' : 'none',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <td style={{ fontFamily: 'Monaco, monospace' }}>
                            {location.timestamp}
                          </td>
                          <td style={{ fontFamily: 'Monaco, monospace' }}>
                            {location.latitude.toFixed(6)}
                          </td>
                          <td style={{ fontFamily: 'Monaco, monospace' }}>
                            {location.longitude.toFixed(6)}
                          </td>
                          <td>
                            {location.formattedDate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>������</div>
            <h2>Sin datos disponibles</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              {isConnected 
                ? 'Esperando ubicaciones via UDP...' 
                : 'Conectando al servidor para recibir datos...'
              }
            </p>
            {!isConnected && (
              <button onClick={refresh} className="btn">
                Reintentar conexión
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ 
        backgroundColor: 'white', 
        borderTop: '1px solid #e5e7eb', 
        marginTop: '48px',
        padding: '24px 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            © 2025 UDP Tracker - Sistema de tracking en tiempo real v{config.APP_VERSION}
          </p>
        </div>
      </footer>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes highlightNew {
            0% {
              background-color: #dcfce7;
              transform: scale(1.01);
            }
            100% {
              background-color: #f0f9ff;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}

export default App;
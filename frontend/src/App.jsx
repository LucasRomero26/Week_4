// src/App.jsx - Versión Simplificada
import React, { useState, useEffect } from 'react';
import './styles/globals.css';

// Configuración básica
const config = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
  APP_NAME: process.env.REACT_APP_APP_NAME || 'UDP Tracker',
  APP_VERSION: '1.0.0'
};

// Hook para obtener la última ubicación
function useLatestLocation() {
  const [latestLocation, setLatestLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchLatestLocation = async () => {
    try {
      setError(null);
      
      const response = await fetch(`${config.API_BASE_URL}/api/locations/latest`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const location = {
          latitude: parseFloat(data.data.latitude),
          longitude: parseFloat(data.data.longitude),
          timestamp: parseInt(data.data.timestamp_value),
          formattedDate: new Date(parseInt(data.data.timestamp_value)).toLocaleString()
        };
        
        setLatestLocation(location);
        setSocketStatus('connected');
        setLastUpdate(Date.now());
      } else {
        setLatestLocation(null);
      }
      
    } catch (err) {
      setError(err.message);
      setSocketStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestLocation();
    const interval = setInterval(fetchLatestLocation, 2000); // Actualizar cada 2 segundos
    return () => clearInterval(interval);
  }, []);

  return {
    latestLocation,
    loading,
    error,
    socketStatus,
    lastUpdate,
    refresh: fetchLatestLocation
  };
}

function App() {
  const { latestLocation, loading, error, socketStatus, lastUpdate, refresh } = useLatestLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h1>{config.APP_NAME}</h1>
          <p>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header className="header">
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#1f2937' }}>
              {config.APP_NAME}
            </h1>
            <p style={{ margin: '8px 0 0 0', fontSize: '16px', color: '#6b7280' }}>
              Sistema de tracking UDP en tiempo real
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container" style={{ paddingTop: '40px' }}>
        {/* Estado de conexión */}
        <div className="card" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>
              {socketStatus === 'connected' ? '������' : '������'}
            </span>
            <span style={{ 
              fontSize: '18px', 
              fontWeight: '600',
              color: socketStatus === 'connected' ? '#059669' : '#dc2626'
            }}>
              {socketStatus === 'connected' ? 'Conectado' : 'Desconectado'}
            </span>
            <button onClick={refresh} className="btn" style={{ marginLeft: '16px' }}>
              ������ Actualizar
            </button>
          </div>
          {lastUpdate && (
            <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              Última actualización: {new Date(lastUpdate).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Datos de ubicación */}
        {error ? (
          <div className="card error" style={{ textAlign: 'center' }}>
            <h2>Error de conexión</h2>
            <p>{error}</p>
            <button onClick={refresh} className="btn">
              Reintentar
            </button>
          </div>
        ) : latestLocation ? (
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '24px' }}>
              Última Ubicación Recibida
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Latitud */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                  Latitud:
                </span>
                <span style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  fontFamily: 'Monaco, monospace',
                  color: '#1f2937'
                }}>
                  {latestLocation.latitude.toFixed(6)}
                </span>
              </div>

              {/* Longitud */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                  Longitud:
                </span>
                <span style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  fontFamily: 'Monaco, monospace',
                  color: '#1f2937'
                }}>
                  {latestLocation.longitude.toFixed(6)}
                </span>
              </div>

              {/* Timestamp */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#374151' }}>
                  Timestamp:
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    fontFamily: 'Monaco, monospace',
                    color: '#1f2937'
                  }}>
                    {latestLocation.timestamp}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#6b7280',
                    marginTop: '4px'
                  }}>
                    {latestLocation.formattedDate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center' }}>
            <h2>Sin datos disponibles</h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              No se han recibido ubicaciones por UDP aún.
            </p>
            <button onClick={refresh} className="btn">
              Verificar nuevamente
            </button>
          </div>
        )}

        {/* Información del sistema */}
        <div className="card" style={{ marginTop: '32px', textAlign: 'center' }}>
          <h3>Información del Sistema</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div>
              <strong>Backend URL:</strong>
              <div className="text-mono text-sm">{config.API_BASE_URL}</div>
            </div>
            <div>
              <strong>Puerto UDP:</strong>
              <div className="text-mono text-sm">6001</div>
            </div>
            <div>
              <strong>Versión:</strong>
              <div className="text-mono text-sm">v{config.APP_VERSION}</div>
            </div>
          </div>
        </div>
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
            © 2025 UDP Tracker - Sistema de tracking en tiempo real
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
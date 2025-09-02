// src/config.js
const config = {
  // URLs del backend
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000',
  
  // Configuración de la aplicación
  APP_NAME: process.env.REACT_APP_APP_NAME || 'UDP Tracker',
  APP_VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  
  // Configuración de endpoints
  API_ENDPOINTS: {
    LOCATIONS: '/api/locations',
    LATEST: '/api/locations/latest',
    RANGE: '/api/locations/range',
    STATS: '/api/locations/stats',
    HEALTH: '/health'
  },
  
  // Configuración de WebSocket
  SOCKET_OPTIONS: {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
  },
  
  // Configuración de la interfaz
  UI_CONFIG: {
    MAX_LOCATIONS_DISPLAY: 50,
    REFRESH_INTERVAL: 30000, // 30 segundos
    MAP_DEFAULT_CENTER: [37.4219983, -122.084],
    MAP_DEFAULT_ZOOM: 15,
    ANIMATION_DURATION: 300
  },
  
  // Configuración de colores para el estado de conexión
  CONNECTION_COLORS: {
    CONNECTED: '#22c55e',    // green-500
    DISCONNECTED: '#ef4444', // red-500
    CONNECTING: '#f59e0b',   // yellow-500
    ERROR: '#dc2626'         // red-600
  },
  
  // Mensajes de la aplicación
  MESSAGES: {
    CONNECTING: 'Conectando al servidor...',
    CONNECTED: 'Conectado al servidor',
    DISCONNECTED: 'Desconectado del servidor',
    RECONNECTING: 'Intentando reconectar...',
    ERROR: 'Error de conexión',
    NO_DATA: 'No hay datos disponibles',
    LOADING: 'Cargando...'
  },
  
  // Configuración de desarrollo
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  
  // Validaciones
  VALIDATION: {
    LAT_MIN: -90,
    LAT_MAX: 90,
    LON_MIN: -180,
    LON_MAX: 180,
    TIMESTAMP_MIN: 0
  }
};

export default config;
// src/components/ConnectionStatus.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  AlertTriangle, 
  Users,
  Clock,
  RefreshCw
} from 'lucide-react';
import config from '../config';

const ConnectionStatus = ({ 
  status, 
  clientCount = 0, 
  lastUpdate, 
  reconnectAttempts = 0,
  onReconnect,
  className = ''
}) => {
  
  // Obtener configuración del estado
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: Wifi,
          message: config.MESSAGES.CONNECTED,
          pulse: false
        };
      case 'connecting':
        return {
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          icon: Loader2,
          message: config.MESSAGES.CONNECTING,
          pulse: true
        };
      case 'reconnecting':
        return {
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          icon: RefreshCw,
          message: `${config.MESSAGES.RECONNECTING} (${reconnectAttempts}/${config.SOCKET_OPTIONS.reconnectionAttempts})`,
          pulse: true
        };
      case 'disconnected':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: WifiOff,
          message: config.MESSAGES.DISCONNECTED,
          pulse: false
        };
      case 'error':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: AlertTriangle,
          message: config.MESSAGES.ERROR,
          pulse: false
        };
      default:
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: WifiOff,
          message: 'Estado desconocido',
          pulse: false
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  
  // Formatear tiempo desde la última actualización
  const formatLastUpdate = () => {
    if (!lastUpdate) return '';
    
    const now = Date.now();
    const diff = now - lastUpdate;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `hace ${minutes}m ${seconds}s`;
    }
    return `hace ${seconds}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center gap-3 px-4 py-2 rounded-lg border
        ${statusConfig.color} ${className}
      `}
    >
      {/* Icono de estado */}
      <div className="relative">
        <StatusIcon 
          className={`
            w-5 h-5
            ${statusConfig.pulse ? 'animate-spin' : ''}
            ${status === 'connected' ? 'animate-pulse-slow' : ''}
          `}
        />
        
        {/* Indicador de pulso para conexión activa */}
        <AnimatePresence>
          {status === 'connected' && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeOut"
              }}
              className="absolute inset-0 bg-green-500 rounded-full -z-10"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Estado y mensaje */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {statusConfig.message}
          </span>
          
          {/* Conteo de clientes conectados */}
          {status === 'connected' && clientCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Users className="w-3 h-3" />
              <span>{clientCount}</span>
            </div>
          )}
        </div>
        
        {/* Información adicional */}
        <div className="flex items-center gap-3 text-xs opacity-75">
          {/* Última actualización */}
          {lastUpdate && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatLastUpdate()}</span>
            </div>
          )}
          
          {/* Intentos de reconexión */}
          {status === 'error' && reconnectAttempts > 0 && (
            <span>
              Intentos: {reconnectAttempts}/{config.SOCKET_OPTIONS.reconnectionAttempts}
            </span>
          )}
        </div>
      </div>

      {/* Botón de reconexión */}
      {(status === 'error' || status === 'disconnected') && onReconnect && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReconnect}
          className="
            px-3 py-1 text-xs font-medium rounded-md
            bg-white border hover:bg-gray-50
            transition-colors duration-200
          "
        >
          Reconectar
        </motion.button>
      )}
    </motion.div>
  );
};

export default ConnectionStatus;

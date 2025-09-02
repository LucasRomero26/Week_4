// src/hooks/useSocket.js
import { useState, useEffect, useCallback, useRef } from 'react';
import socketService from '../services/SocketService';
import config from '../config';

const useSocket = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [clientInfo, setClientInfo] = useState(null);
  const [clientCount, setClientCount] = useState(0);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const isInitialized = useRef(false);

  // Manejar cambios de estado de conexión
  const handleConnectionStatus = useCallback((data) => {
    setConnectionStatus(data.status);
    setError(data.error || null);
    setReconnectAttempts(data.attempts || 0);
    
    console.log('������ Estado de conexión actualizado:', data);
  }, []);

  // Manejar información de conexión
  const handleConnectionInfo = useCallback((data) => {
    setClientInfo(data);
    setClientCount(data.totalClients || 0);
    console.log('ℹ️ Información de cliente actualizada:', data);
  }, []);

  // Manejar actualización de conteo de clientes
  const handleClientCountUpdate = useCallback((data) => {
    setClientCount(data.totalClients || 0);
  }, []);

  // Conectar al WebSocket
  const connect = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      setError(null);
      
      await socketService.connect();
      
      // Configurar listeners
      socketService.on('connection_status', handleConnectionStatus);
      socketService.on('connection-info', handleConnectionInfo);
      socketService.on('client-count-update', handleClientCountUpdate);
      
      // Iniciar heartbeat
      socketService.startHeartbeat(30000);
      
      return true;
    } catch (err) {
      console.error('Error conectando WebSocket:', err);
      setError(err.message);
      setConnectionStatus('error');
      return false;
    }
  }, [handleConnectionStatus, handleConnectionInfo, handleClientCountUpdate]);

  // Desconectar del WebSocket
  const disconnect = useCallback(() => {
    socketService.off('connection_status', handleConnectionStatus);
    socketService.off('connection-info', handleConnectionInfo);
    socketService.off('client-count-update', handleClientCountUpdate);
    
    socketService.disconnect();
    
    setConnectionStatus('disconnected');
    setClientInfo(null);
    setClientCount(0);
    setError(null);
    setReconnectAttempts(0);
  }, [handleConnectionStatus, handleConnectionInfo, handleClientCountUpdate]);

  // Solicitar datos iniciales
  const requestInitialData = useCallback(() => {
    socketService.requestInitialData();
  }, []);

  // Solicitar estadísticas
  const requestStats = useCallback(() => {
    socketService.requestStats();
  }, []);

  // Enviar ping
  const sendPing = useCallback(() => {
    socketService.sendPing();
  }, []);

  // Suscribirse a eventos específicos
  const subscribe = useCallback((event, callback) => {
    socketService.on(event, callback);
    
    // Retornar función de cleanup
    return () => {
      socketService.off(event, callback);
    };
  }, []);

  // Verificar si está conectado
  const isConnected = useCallback(() => {
    return socketService.isConnected();
  }, []);

  // Obtener estado detallado de conexión
  const getDetailedStatus = useCallback(() => {
    return {
      ...socketService.getConnectionState(),
      clientInfo,
      clientCount,
      error,
      isMaxReconnectAttemptsReached: reconnectAttempts >= config.SOCKET_OPTIONS.reconnectionAttempts
    };
  }, [clientInfo, clientCount, error, reconnectAttempts]);

  // Auto-conectar cuando se monta el hook
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      
      console.log('������ Inicializando conexión WebSocket...');
      connect();
    }

    // Cleanup al desmontar
    return () => {
      if (isInitialized.current) {
        console.log('������ Limpiando conexión WebSocket...');
        disconnect();
        isInitialized.current = false;
      }
    };
  }, [connect, disconnect]);

  // Reconectar automáticamente en caso de error (con límite)
  useEffect(() => {
    if (connectionStatus === 'error' && 
        reconnectAttempts < config.SOCKET_OPTIONS.reconnectionAttempts) {
      
      const delay = Math.min(
        config.SOCKET_OPTIONS.reconnectionDelay * Math.pow(2, reconnectAttempts),
        config.SOCKET_OPTIONS.reconnectionDelayMax || 5000
      );
      
      console.log(`������ Reintentando conexión en ${delay}ms (intento ${reconnectAttempts + 1})`);
      
      const timer = setTimeout(() => {
        connect();
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [connectionStatus, reconnectAttempts, connect]);

  return {
    // Estados
    connectionStatus,
    clientInfo,
    clientCount,
    error,
    reconnectAttempts,
    
    // Métodos
    connect,
    disconnect,
    requestInitialData,
    requestStats,
    sendPing,
    subscribe,
    isConnected,
    getDetailedStatus,
    
    // Estados derivados
    isConnecting: connectionStatus === 'connecting',
    isReconnecting: connectionStatus === 'reconnecting',
    hasError: !!error,
    isMaxReconnectAttemptsReached: reconnectAttempts >= config.SOCKET_OPTIONS.reconnectionAttempts
  };
};

export default useSocket;
// src/services/SocketService.js
import { io } from 'socket.io-client';
import config from '../config';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config.SOCKET_OPTIONS.reconnectionAttempts || 5;
  }

  // Conectar al servidor WebSocket
  connect() {
    if (this.socket && this.socket.connected) {
      console.log('������ Ya conectado a WebSocket');
      return Promise.resolve(this.socket);
    }

    console.log('������ Conectando a WebSocket:', config.SOCKET_URL);
    
    this.socket = io(config.SOCKET_URL, {
      ...config.SOCKET_OPTIONS,
      autoConnect: false
    });

    this.setupEventHandlers();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout de conexión WebSocket'));
      }, config.SOCKET_OPTIONS.timeout || 20000);

      this.socket.once('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Conectado a WebSocket');
        this.connectionState = 'connected';
        this.reconnectAttempts = 0;
        resolve(this.socket);
      });

      this.socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ Error de conexión WebSocket:', error);
        this.connectionState = 'error';
        reject(error);
      });

      this.socket.connect();
    });
  }

  // Configurar manejadores de eventos
  setupEventHandlers() {
    if (!this.socket) return;

    // Eventos de conexión
    this.socket.on('connect', () => {
      console.log('������ WebSocket conectado:', this.socket.id);
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.notifyListeners('connection_status', { 
        status: 'connected', 
        clientId: this.socket.id 
      });

      // Solicitar datos iniciales
      this.requestInitialData();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('������ WebSocket desconectado:', reason);
      this.connectionState = 'disconnected';
      this.notifyListeners('connection_status', { 
        status: 'disconnected', 
        reason 
      });
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error);
      this.connectionState = 'error';
      this.reconnectAttempts++;
      
      this.notifyListeners('connection_status', { 
        status: 'error', 
        error: error.message,
        attempts: this.reconnectAttempts 
      });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('������ WebSocket reconectado, intento:', attemptNumber);
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      this.notifyListeners('connection_status', { 
        status: 'reconnected', 
        attempt: attemptNumber 
      });
    });

    this.socket.on('reconnecting', (attemptNumber) => {
      console.log('������ Intentando reconectar WebSocket, intento:', attemptNumber);
      this.connectionState = 'reconnecting';
      this.notifyListeners('connection_status', { 
        status: 'reconnecting', 
        attempt: attemptNumber 
      });
    });

    // Eventos de datos
    this.socket.on('location-update', (data) => {
      console.log('������ Nueva ubicación recibida:', data);
      this.notifyListeners('location-update', data);
    });

    this.socket.on('initial-data', (data) => {
      console.log('������ Datos iniciales recibidos:', data);
      this.notifyListeners('initial-data', data);
    });

    this.socket.on('stats-update', (data) => {
      console.log('������ Estadísticas actualizadas:', data);
      this.notifyListeners('stats-update', data);
    });

    this.socket.on('client-count-update', (data) => {
      console.log('������ Conteo de clientes actualizado:', data);
      this.notifyListeners('client-count-update', data);
    });

    // Manejar pong del servidor
    this.socket.on('pong', (data) => {
      console.log('������ Pong recibido del servidor:', data);
      this.notifyListeners('pong', data);
    });

    // Información de conexión
    this.socket.on('connection-info', (data) => {
      console.log('ℹ️ Información de conexión:', data);
      this.notifyListeners('connection-info', data);
    });
  }

  // Solicitar datos iniciales al servidor
  requestInitialData() {
    if (this.socket && this.socket.connected) {
      console.log('������ Solicitando datos iniciales...');
      this.socket.emit('request-initial-data');
    }
  }

  // Solicitar estadísticas
  requestStats() {
    if (this.socket && this.socket.connected) {
      console.log('������ Solicitando estadísticas...');
      this.socket.emit('request-stats');
    }
  }

  // Enviar ping al servidor
  sendPing() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ping');
    }
  }

  // Agregar listener para eventos
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    console.log(`������ Listener agregado para evento: ${event}`);
  }

  // Remover listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      
      // Si no quedan listeners, remover el evento completo
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
      
      console.log(`������ Listener removido para evento: ${event}`);
    }
  }

  // Notificar a todos los listeners de un evento
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener para evento ${event}:`, error);
        }
      });
    }
  }

  // Desconectar
  disconnect() {
    if (this.socket) {
      console.log('������ Desconectando WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.connectionState = 'disconnected';
      this.listeners.clear();
    }
  }

  // Obtener estado de conexión
  getConnectionState() {
    return {
      state: this.connectionState,
      connected: this.socket?.connected || false,
      id: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  // Verificar si está conectado
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Configurar auto-ping cada cierto tiempo
  startHeartbeat(interval = 30000) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.sendPing();
      }
    }, interval);

    console.log(`������ Heartbeat iniciado cada ${interval}ms`);
  }

  // Detener auto-ping
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('������ Heartbeat detenido');
    }
  }

  // Destruir instancia
  destroy() {
    this.stopHeartbeat();
    this.disconnect();
    this.listeners.clear();
    console.log('������ SocketService destruido');
  }
}

// Crear instancia singleton
const socketService = new SocketService();

export default socketService;
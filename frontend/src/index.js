// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Configurar el root de la aplicación
const container = document.getElementById('root');
const root = createRoot(container);

// Error boundary personalizado
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log del error para debugging
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Oops! Algo salió mal
            </h1>
            
            <p className="text-gray-600 mb-4">
              Ha ocurrido un error inesperado en la aplicación. Por favor, recarga la página para continuar.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Recargar Página
              </button>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Ver detalles del error (solo desarrollo)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error && this.state.error.toString()}
                    </div>
                    <div>
                      <strong>Stack trace:</strong>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Verificar si el navegador soporta las características necesarias
const checkBrowserCompatibility = () => {
  const features = {
    WebSocket: typeof WebSocket !== 'undefined',
    Promise: typeof Promise !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    localStorage: typeof Storage !== 'undefined',
  };

  const unsupportedFeatures = Object.keys(features).filter(feature => !features[feature]);
  
  if (unsupportedFeatures.length > 0) {
    console.warn('Características no soportadas:', unsupportedFeatures);
    return false;
  }
  
  return true;
};

// Componente de compatibilidad del navegador
const BrowserCompatibilityWarning = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
      <div className="mb-4">
        <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
      
      <h1 className="text-lg font-semibold text-gray-900 mb-2">
        Navegador No Soportado
      </h1>
      
      <p className="text-gray-600 mb-4">
        Tu navegador no soporta todas las características necesarias para ejecutar esta aplicación.
        Por favor, actualiza tu navegador o usa uno más reciente.
      </p>
      
      <div className="text-sm text-gray-500">
        <p className="mb-2">Navegadores recomendados:</p>
        <ul className="text-left space-y-1">
          <li>• Chrome 80+</li>
          <li>• Firefox 75+</li>
          <li>• Safari 13+</li>
          <li>• Edge 80+</li>
        </ul>
      </div>
    </div>
  </div>
);

// Función para inicializar la aplicación
const initializeApp = () => {
  console.log('������ Inicializando UDP Tracker Frontend...');
  console.log('������ Entorno:', process.env.NODE_ENV);
  console.log('������ API Base URL:', process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000');
  console.log('������ Socket URL:', process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000');
  
  // Verificar compatibilidad del navegador
  if (!checkBrowserCompatibility()) {
    root.render(<BrowserCompatibilityWarning />);
    return;
  }

  // Renderizar la aplicación principal
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Manejar errores globales no capturados
window.addEventListener('error', (event) => {
  console.error('Error global no capturado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesa rechazada no manejada:', event.reason);
});

// Service worker registration (opcional para PWA)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
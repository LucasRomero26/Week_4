// src/components/AnimatedField.jsx
import React, { useState, useEffect, useRef } from 'react';

const AnimatedField = ({ 
  label, 
  value, 
  formatValue = (val) => val,
  subtitle = null,
  className = "",
  animationDuration = 2000 // Duración de la animación en ms
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const previousValue = useRef(value);
  const timeoutRef = useRef(null);

  // Detectar cambios en el valor para activar la animación
  useEffect(() => {
    // Solo animar si el valor realmente cambió y no es la primera carga
    if (previousValue.current !== undefined && previousValue.current !== value) {
      setShouldAnimate(true);
      setIsAnimating(true);
      
      // Limpiar timeout anterior si existe
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Terminar la animación después del tiempo especificado
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        setShouldAnimate(false);
      }, animationDuration);
    }
    
    // Actualizar el valor anterior
    previousValue.current = value;
    
    // Cleanup del timeout
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, animationDuration]);

  const fieldStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transformOrigin: 'center',
    backgroundColor: isAnimating ? '#dcfce7' : '#f9fafb', // Verde claro cuando se anima
    borderColor: isAnimating ? '#22c55e' : '#e5e7eb',
    transform: isAnimating ? 'scale(1.02)' : 'scale(1)',
    boxShadow: isAnimating 
      ? '0 4px 12px rgba(34, 197, 94, 0.15), 0 0 0 2px rgba(34, 197, 94, 0.1)' 
      : '0 1px 2px rgba(0, 0, 0, 0.05)',
    position: 'relative',
    overflow: 'hidden'
  };

  const labelStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: isAnimating ? '#15803d' : '#374151',
    transition: 'color 0.3s ease'
  };

  const valueContainerStyle = {
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end'
  };

  const valueStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    color: isAnimating ? '#15803d' : '#1f2937',
    transition: 'color 0.3s ease'
  };

  const subtitleStyle = {
    fontSize: '14px',
    color: isAnimating ? '#16a34a' : '#6b7280',
    marginTop: '4px',
    transition: 'color 0.3s ease'
  };

  return (
    <div 
      className={`animated-field ${className}`}
      style={fieldStyle}
    >
      {/* Efecto de brillo que se mueve cuando se anima */}
      {isAnimating && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: 'shimmer 0.8s ease-out',
            pointerEvents: 'none'
          }}
        />
      )}
      
      <span style={labelStyle}>
        {label}:
      </span>
      
      <div style={valueContainerStyle}>
        <span style={valueStyle}>
          {formatValue(value)}
        </span>
        {subtitle && (
          <div style={subtitleStyle}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Indicador de actualización */}
      {isAnimating && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            backgroundColor: '#22c55e',
            borderRadius: '50%',
            animation: 'pulse 1s ease-in-out infinite'
          }}
        />
      )}

      <style>
        {`
          @keyframes shimmer {
            0% {
              left: -100%;
            }
            100% {
              left: 100%;
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.2);
            }
          }
          
          .animated-field:hover {
            transform: scale(1.01) !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
          }
        `}
      </style>
    </div>
  );
};

export default AnimatedField;
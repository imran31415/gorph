/**
 * Environment detection utilities for Gorph app
 */

export const isProduction = (): boolean => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  
  // Consider it production if we're on a real domain (not localhost or local IPs)
  return hostname !== 'localhost' && 
         hostname !== '127.0.0.1' && 
         !hostname.startsWith('192.168') && 
         !hostname.startsWith('10.0') &&
         !hostname.startsWith('172.16') &&
         hostname !== '';
};

export const isDevelopment = (): boolean => {
  return !isProduction();
};

export const getBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost:8081'; // Fallback for SSR
  }

  if (isProduction()) {
    return `${window.location.protocol}//${window.location.host}`;
  }

  // Development: try to use current hostname with Expo dev server port
  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:8081`;
};

export const getWasmUrl = (): string => {
  return `${getBaseUrl()}/gorph.wasm`;
};

export const getWasmExecUrl = (): string => {
  return `${getBaseUrl()}/wasm_exec.js`;
};

/**
 * Get development URLs for mobile bridges to try
 */
export const getDevelopmentWasmUrls = (): string[] => {
  return [
    'http://localhost:8081/gorph.wasm',
    'http://192.168.86.127:8081/gorph.wasm',
    'http://localhost:8082/gorph.wasm', // fallback port
    'http://192.168.86.127:8082/gorph.wasm'
  ];
};

export const getEnvironmentInfo = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'unknown';
  const port = typeof window !== 'undefined' ? window.location.port : 'unknown';
  
  return {
    hostname,
    protocol, 
    port,
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    baseUrl: getBaseUrl(),
    wasmUrl: getWasmUrl()
  };
}; 
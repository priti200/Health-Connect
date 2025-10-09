export const environment = {
  production: false,
  apiUrl: 'http://localhost:8081/api',
  wsUrl: 'http://localhost:8081/ws',
  appName: 'HealthConnect',
  version: '1.0.0',
  // WebSocket configuration
  websocket: {
    url: 'http://localhost:8081/ws',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    heartbeatIncoming: 25000,
    heartbeatOutgoing: 25000
  },
  // Agora Video Configuration
  agora: {
    appId: 'e4e46730b7c246babef60cdf947704e3'
  }
};

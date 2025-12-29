export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080/api',
  wsUrl: 'http://localhost:8080/ws',
  appName: 'HealthConnect',
  version: '1.0.0',
  agora: {
    appId: 'e4e46730b7c246babef60cdf947704e3'
  },
  geminiApiUrl: 'https://us-central1-said-eb2f5.cloudfunctions.net/gemini_medical_assistant',
  websocket: {
    url: 'http://localhost:8080/ws',
    maxReconnectAttempts: 5,
    reconnectInterval: 3000,
    heartbeatIncoming: 25000,
    heartbeatOutgoing: 25000
  }
};

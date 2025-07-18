import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

interface WasmBridgeRef {
  yamlToDot: (yaml: string) => Promise<any>;
  validateYaml: (yaml: string) => Promise<any>;
  getTemplates: () => Promise<any>;
}

interface WasmBridgeProps {
  onReady: () => void;
  onError: (error: string) => void;
}

const WasmBridgeSimple = forwardRef<WasmBridgeRef, WasmBridgeProps>((props, ref) => {
  const webViewRef = useRef<WebView>(null);
  const messageCallbacks = useRef<Map<string, (result: any) => void>>(new Map());
  
  // Generate unique message IDs
  const generateMessageId = () => Math.random().toString(36).substr(2, 9);

  // Send message to WebView and return a promise
  const sendMessage = (type: string, data?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const messageId = generateMessageId();
      messageCallbacks.current.set(messageId, resolve);
      
      const message = { id: messageId, type, data };
      console.log('Simple Bridge: Sending message to WebView:', { id: messageId, type });
      webViewRef.current?.postMessage(JSON.stringify(message));
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (messageCallbacks.current.has(messageId)) {
          messageCallbacks.current.delete(messageId);
          console.error('Simple Bridge: Message timeout for:', messageId);
          reject(new Error(`WebView message timeout for ${type}`));
        }
      }, 10000);
    });
  };

  // Handle messages from WebView
  const handleMessage = (event: any) => {
    try {
      console.log('Simple Bridge received message:', event.nativeEvent.data);
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'ready') {
        console.log('Simple Bridge: WebView reported ready');
        props.onReady();
      } else if (message.type === 'error') {
        console.error('Simple Bridge: WebView reported error:', message.data);
        props.onError(message.data);
      } else if (message.type === 'response' && message.id && messageCallbacks.current.has(message.id)) {
        console.log('Simple Bridge: Received response for message', message.id);
        const callback = messageCallbacks.current.get(message.id);
        messageCallbacks.current.delete(message.id);
        callback?.(message.data);
      } else {
        console.log('Simple Bridge: Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
      props.onError(`Message parsing error: ${error}`);
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    yamlToDot: (yaml: string) => sendMessage('yamlToDot', yaml),
    validateYaml: (yaml: string) => sendMessage('validateYaml', yaml),
    getTemplates: () => sendMessage('getTemplates'),
  }));

  // Simplified HTML that proxies to parent window WASM functions
  const webViewHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>WASM Bridge Simple</title>
      </head>
      <body>
        <div>WASM Bridge Loading...</div>
        <script>
          console.log('Simple WebView: Starting...');
          
          // Message handling
          const sendMessage = (type, data, id = null) => {
            const message = { type, data, id };
            console.log('Simple WebView: Sending message:', message);
            window.ReactNativeWebView.postMessage(JSON.stringify(message));
          };

          // Simple fallback functions that generate basic DOT notation
          const simpleFallbackTemplates = {
            simple: \`entities:
  - id: Client
    category: USER_FACING
    description: "Web browser client"
    status: healthy
    owner: frontend
    environment: production

  - id: WebServer
    category: FRONTEND
    description: "Simple web server"
    status: healthy
    owner: ops
    environment: production

  - id: Database
    category: DATABASE
    description: "SQLite database"
    status: degraded
    owner: ops
    environment: production

connections:
  - from: Client
    to: WebServer
    type: HTTP_Request
  - from: WebServer
    to: Database
    type: DB_Connection\`,
            webapp: \`entities:
  - id: User
    category: USER_FACING
    description: "End user"
    status: healthy

  - id: Frontend
    category: FRONTEND
    description: "React application"
    status: healthy

  - id: Backend
    category: BACKEND
    description: "API server"
    status: healthy

  - id: Database
    category: DATABASE
    description: "PostgreSQL"
    status: healthy

connections:
  - from: User
    to: Frontend
    type: HTTP_Request
  - from: Frontend
    to: Backend
    type: API_Call
  - from: Backend
    to: Database
    type: DB_Connection\`
          };

          const simpleFallbackYamlToDot = (yamlInput) => {
            try {
              // Simple DOT generation for basic connectivity
              const lines = yamlInput.split('\\n');
              let entities = [];
              let connections = [];
              
              // Parse entities
              let inEntities = false;
              let inConnections = false;
              
              for (let line of lines) {
                line = line.trim();
                if (line === 'entities:') {
                  inEntities = true;
                  inConnections = false;
                } else if (line === 'connections:') {
                  inEntities = false;
                  inConnections = true;
                } else if (line.startsWith('- id:') && inEntities) {
                  const id = line.split(':')[1].trim();
                  entities.push(id);
                } else if (line.startsWith('- from:') && inConnections) {
                  const from = line.split(':')[1].trim();
                  connections.push({ from });
                } else if (line.startsWith('to:') && inConnections && connections.length > 0) {
                  const to = line.split(':')[1].trim();
                  connections[connections.length - 1].to = to;
                }
              }
              
              // Generate DOT
              let dot = 'digraph Infrastructure {\\n';
              dot += '  rankdir=LR;\\n';
              dot += '  node [shape=box];\\n';
              
              for (let entity of entities) {
                dot += \`  \${entity} [label="\${entity}"];\\n\`;
              }
              
              for (let conn of connections) {
                if (conn.from && conn.to) {
                  dot += \`  \${conn.from} -> \${conn.to};\\n\`;
                }
              }
              
              dot += '}\\n';
              
              return { dot, error: null };
            } catch (error) {
              return { error: error.toString(), dot: null };
            }
          };

          // Listen for messages from React Native
          window.addEventListener('message', async (event) => {
            try {
              const message = JSON.parse(event.data);
              const { id, type, data } = message;
              
              console.log('Simple WebView: Received message:', { id, type });
              
              if (type === 'yamlToDot') {
                const result = simpleFallbackYamlToDot(data);
                sendMessage('response', result, id);
              } else if (type === 'validateYaml') {
                // Simple validation - just check if it parses
                try {
                  const result = simpleFallbackYamlToDot(data);
                  sendMessage('response', { valid: !result.error, errors: result.error ? [result.error] : [] }, id);
                } catch (error) {
                  sendMessage('response', { valid: false, errors: [error.toString()] }, id);
                }
              } else if (type === 'getTemplates') {
                sendMessage('response', simpleFallbackTemplates, id);
              } else {
                sendMessage('response', { error: 'Unknown function type: ' + type }, id);
              }
            } catch (error) {
              console.error('Simple WebView message error:', error);
              sendMessage('error', error.toString());
            }
          });

          // Signal ready
          setTimeout(() => {
            console.log('Simple WebView: Ready');
            sendMessage('ready', 'Simple fallback bridge ready');
          }, 100);
        </script>
      </body>
    </html>
  `;

  // Only render WebView on mobile platforms
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}>
      <WebView
        ref={webViewRef}
        source={{ html: webViewHTML }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        style={{ flex: 1 }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('Simple WebView error:', nativeEvent);
          props.onError(`WebView error: ${nativeEvent.description}`);
        }}
        onLoadStart={() => console.log('Simple WebView: Load started')}
        onLoadEnd={() => console.log('Simple WebView: Load ended')}
      />
    </View>
  );
});

export default WasmBridgeSimple;
export type { WasmBridgeRef }; 
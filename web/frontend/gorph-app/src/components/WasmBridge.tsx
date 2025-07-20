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

const WasmBridge = forwardRef<WasmBridgeRef, WasmBridgeProps>((props, ref) => {
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
      console.log('Bridge: Sending message to WebView:', { id: messageId, type });
      webViewRef.current?.postMessage(JSON.stringify(message));
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (messageCallbacks.current.has(messageId)) {
          messageCallbacks.current.delete(messageId);
          console.error('Bridge: Message timeout for:', messageId);
          reject(new Error(`WebView message timeout for ${type}`));
        }
      }, 10000);
    });
  };

  // Handle messages from WebView
  const handleMessage = (event: any) => {
    try {
      console.log('Bridge received message:', event.nativeEvent.data);
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'ready') {
        console.log('Bridge: WebView reported ready');
        props.onReady();
      } else if (message.type === 'error') {
        console.error('Bridge: WebView reported error:', message.data);
        props.onError(message.data);
      } else if (message.type === 'response' && message.id && messageCallbacks.current.has(message.id)) {
        console.log('Bridge: Received response for message', message.id);
        const callback = messageCallbacks.current.get(message.id);
        messageCallbacks.current.delete(message.id);
        callback?.(message.data);
      } else {
        console.log('Bridge: Unhandled message type:', message.type);
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

  // HTML content for WebView with WASM loading
  const webViewHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>WASM Bridge</title>
      </head>
      <body>
        <script>
          // Message handling
          const sendMessage = (type, data, id = null) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, data, id }));
          };

          // Listen for messages from React Native
          window.addEventListener('message', async (event) => {
            try {
              const message = JSON.parse(event.data);
              const { id, type, data } = message;
              
              if (type === 'yamlToDot' && window.yamlToDot) {
                const result = window.yamlToDot(data);
                sendMessage('response', result, id);
              } else if (type === 'validateYaml' && window.validateYaml) {
                const result = window.validateYaml(data);
                sendMessage('response', result, id);
              } else if (type === 'getTemplates' && window.getTemplates) {
                const result = window.getTemplates();
                sendMessage('response', result, id);
              } else {
                sendMessage('response', { error: 'Function not available' }, id);
              }
            } catch (error) {
              console.error('WebView message error:', error);
              sendMessage('error', error.toString());
            }
          });

          // Load WASM
          async function loadWasm() {
            try {
              console.log('WebView: Loading WASM...');
              
              // Get proper base URL - dynamic based on environment
              const getBaseUrl = () => {
                const hostname = window.location.hostname;
                
                // Production check: if we're on a real domain, use it
                if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168') && !hostname.startsWith('10.0')) {
                  const baseUrl = \`\${window.location.protocol}//\${window.location.host}\`;
                  console.log('WebView: Using production URL:', baseUrl);
                  return baseUrl;
                }
                
                // Development: use Expo dev server
                const host = hostname || '192.168.86.127'; // Use detected IP or fallback
                const port = '8081'; // Expo dev server port
                const baseUrl = \`http://\${host}:\${port}\`;
                console.log('WebView: Using Expo dev server URL:', baseUrl);
                return baseUrl;
              };
              
              const baseUrl = getBaseUrl();
              
              // Load wasm_exec.js from CDN to avoid URL issues
              console.log('WebView: Loading wasm_exec.js from CDN...');
              const wasmScript = document.createElement('script');
              wasmScript.src = 'https://cdn.jsdelivr.net/gh/golang/go@go1.21.0/misc/wasm/wasm_exec.js';
              document.head.appendChild(wasmScript);
              
              await new Promise((resolve, reject) => {
                wasmScript.onload = () => {
                  console.log('WebView: wasm_exec.js loaded successfully from CDN');
                  resolve();
                };
                wasmScript.onerror = (error) => {
                  console.error('WebView: Failed to load wasm_exec.js from CDN:', error);
                  reject(error);
                };
                
                // Timeout after 15 seconds
                setTimeout(() => {
                  reject(new Error('wasm_exec.js load timeout'));
                }, 15000);
              });
              
              // Initialize Go
              console.log('WebView: Initializing Go...');
              const go = new Go();
              
              // Load WASM file with proper error handling
              console.log('WebView: Fetching WASM file from:', \`\${baseUrl}/gorph.wasm\`);
              
              let response;
              try {
                response = await fetch(\`\${baseUrl}/gorph.wasm\`, {
                  method: 'GET',
                  cache: 'no-cache'
                });
                
                if (!response.ok) {
                  throw new Error(\`WASM fetch failed: \${response.status} \${response.statusText}\`);
                }
              } catch (fetchError) {
                console.error('WebView: WASM fetch error:', fetchError);
                throw new Error(\`Cannot load WASM file: \${fetchError.message}\`);
              }
              
              console.log('WebView: Converting response to ArrayBuffer...');
              const bytes = await response.arrayBuffer();
              console.log(\`WebView: WASM file size: \${bytes.byteLength} bytes\`);
              
              console.log('WebView: Instantiating WASM module...');
              const result = await WebAssembly.instantiate(bytes, go.importObject);
              console.log('WebView: WASM module instantiated successfully');
              
              // Run Go program
              console.log('WebView: Running Go program...');
              go.run(result.instance);
              console.log('WebView: Go program started');
              
              // Wait for functions to be available
              let attempts = 0;
              const maxAttempts = 100;
              const checkFunctions = () => {
                attempts++;
                console.log(\`WebView: Checking for WASM functions (attempt \${attempts}/\${maxAttempts})...\`);
                
                const hasYamlToDot = typeof window.yamlToDot === 'function';
                const hasValidateYaml = typeof window.validateYaml === 'function';
                const hasGetTemplates = typeof window.getTemplates === 'function';
                
                console.log(\`WebView: Functions status - yamlToDot: \${hasYamlToDot}, validateYaml: \${hasValidateYaml}, getTemplates: \${hasGetTemplates}\`);
                
                if (hasYamlToDot && hasValidateYaml && hasGetTemplates) {
                  console.log('WebView: All WASM functions are ready!');
                  sendMessage('ready', 'WASM loaded successfully');
                } else if (attempts < maxAttempts) {
                  setTimeout(checkFunctions, 100);
                } else {
                  const error = \`WASM functions not available after \${maxAttempts} attempts. Available functions: \${Object.keys(window).filter(k => k.startsWith('yaml') || k.startsWith('validate') || k.startsWith('get')).join(', ')}\`;
                  console.error('WebView:', error);
                  throw new Error(error);
                }
              };
              
              setTimeout(checkFunctions, 100);
              
            } catch (error) {
              console.error('WebView WASM loading error:', error);
              sendMessage('error', error.toString());
            }
          }

          // Start loading when DOM is ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadWasm);
          } else {
            loadWasm();
          }
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
        domStorageEnabled={true}
        startInLoadingState={false}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        originWhitelist={['*']}
        allowsLinkPreview={false}
        cacheEnabled={false}
        incognito={false}
        style={{ flex: 1 }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
          props.onError(`WebView error: ${nativeEvent.description}`);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error:', nativeEvent);
          props.onError(`WebView HTTP error: ${nativeEvent.statusCode}`);
        }}
        onLoadStart={() => console.log('WebView: Load started')}
        onLoadEnd={() => console.log('WebView: Load ended')}
      />
    </View>
  );
});

export default WasmBridge;
export type { WasmBridgeRef }; 
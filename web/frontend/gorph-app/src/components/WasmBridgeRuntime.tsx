import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
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

const WasmBridgeRuntime = forwardRef<WasmBridgeRef, WasmBridgeProps>((props, ref) => {
  const webViewRef = useRef<WebView>(null);
  const messageCallbacks = useRef<Map<string, (result: any) => void>>(new Map());
  const [wasmBase64, setWasmBase64] = useState<string | null>(null);
  const [webViewReady, setWebViewReady] = useState(false);
  
  // Generate unique message IDs
  const generateMessageId = () => Math.random().toString(36).substr(2, 9);

  // Load WASM file as base64 in React Native
  useEffect(() => {
    const loadWasmFile = async () => {
      try {
        console.log('Runtime Bridge: Loading WASM file in React Native...');
        
        // Try different URLs for the Expo dev server
        const possibleUrls = [
          'http://localhost:8081/gorph.wasm',
          'http://192.168.86.127:8081/gorph.wasm',
          'http://localhost:8082/gorph.wasm', // fallback port
          'http://192.168.86.127:8082/gorph.wasm'
        ];
        
        let arrayBuffer = null;
        let successUrl = null;
        
        for (const url of possibleUrls) {
          try {
            console.log(`Runtime Bridge: Trying WASM URL: ${url}`);
            const response = await fetch(url);
            if (response.ok) {
              console.log(`Runtime Bridge: Successfully fetched WASM from ${url}`);
              arrayBuffer = await response.arrayBuffer();
              successUrl = url;
              break;
            } else {
              console.log(`Runtime Bridge: Failed to fetch from ${url}: ${response.status}`);
            }
          } catch (urlError) {
            console.log(`Runtime Bridge: Error fetching from ${url}:`, urlError instanceof Error ? urlError.message : String(urlError));
            continue;
          }
        }
        
        if (!arrayBuffer) {
          throw new Error('Could not load WASM file from any URL');
        }
        
        console.log(`Runtime Bridge: WASM file loaded from ${successUrl}, size: ${arrayBuffer.byteLength} bytes`);
        
        // Convert to base64 using proper method for React Native
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = '';
        const chunkSize = 8192; // Process in chunks to avoid stack overflow
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.slice(i, i + chunkSize);
          binaryString += String.fromCharCode.apply(null, Array.from(chunk));
        }
        
        const base64String = btoa(binaryString);
        console.log(`Runtime Bridge: WASM converted to base64, length: ${base64String.length}`);
        setWasmBase64(base64String);
      } catch (error) {
        console.error('Runtime Bridge: Failed to load WASM file in React Native:', error);
        props.onError(`Failed to load WASM: ${error}`);
      }
    };

    loadWasmFile();
  }, []);

  // Send WASM data to WebView when both are ready
  useEffect(() => {
    if (wasmBase64 && webViewReady && webViewRef.current) {
      console.log('Runtime Bridge: Sending WASM data to WebView...');
      webViewRef.current.postMessage(JSON.stringify({
        type: 'wasmData',
        data: wasmBase64
      }));
    }
  }, [wasmBase64, webViewReady]);

  // Send message to WebView and return a promise
  const sendMessage = (type: string, data?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const messageId = generateMessageId();
      messageCallbacks.current.set(messageId, resolve);
      
      const message = { id: messageId, type, data };
      console.log('Runtime Bridge: Sending message to WebView:', { id: messageId, type });
      webViewRef.current?.postMessage(JSON.stringify(message));
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (messageCallbacks.current.has(messageId)) {
          messageCallbacks.current.delete(messageId);
          console.error('Runtime Bridge: Message timeout for:', messageId);
          reject(new Error(`WebView message timeout for ${type}`));
        }
      }, 10000);
    });
  };

  // Handle messages from WebView
  const handleMessage = (event: any) => {
    try {
      console.log('Runtime Bridge received message:', event.nativeEvent.data);
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'webviewReady') {
        console.log('Runtime Bridge: WebView is ready for WASM data');
        setWebViewReady(true);
      } else if (message.type === 'ready') {
        console.log('Runtime Bridge: WebView reported WASM ready');
        props.onReady();
      } else if (message.type === 'error') {
        console.error('Runtime Bridge: WebView reported error:', message.data);
        props.onError(message.data);
      } else if (message.type === 'response' && message.id && messageCallbacks.current.has(message.id)) {
        console.log('Runtime Bridge: Received response for message', message.id);
        const callback = messageCallbacks.current.get(message.id);
        messageCallbacks.current.delete(message.id);
        callback?.(message.data);
      } else {
        console.log('Runtime Bridge: Unhandled message type:', message.type);
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

    // WebView HTML that receives WASM data from React Native
  const webViewHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>WASM Bridge Runtime</title>
      </head>
      <body>
        <script>
          console.log('Runtime WASM Bridge: Starting...');
          
          let wasmBase64Data = null;
          let wasmLoadingStarted = false;
          
          // Message handling
          const sendMessage = (type, data, id = null) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type, data, id }));
          };

          // Listen for messages from React Native
          window.addEventListener('message', async (event) => {
            try {
              const message = JSON.parse(event.data);
              const { id, type, data } = message;
              
              if (type === 'wasmData') {
                console.log('Runtime Bridge: Received WASM data from React Native, length:', data.length);
                wasmBase64Data = data;
                if (!wasmLoadingStarted) {
                  wasmLoadingStarted = true;
                  loadWasm();
                }
              } else if (type === 'yamlToDot' && window.yamlToDot) {
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

          // Load WASM using received base64 data
          async function loadWasm() {
            try {
              if (!wasmBase64Data) {
                console.log('Runtime Bridge: Waiting for WASM data...');
                return;
              }
              
              console.log('Runtime Bridge: Loading wasm_exec.js from CDN...');
              
              // Load wasm_exec.js from CDN
              const wasmScript = document.createElement('script');
              wasmScript.src = 'https://cdn.jsdelivr.net/gh/golang/go@go1.21.0/misc/wasm/wasm_exec.js';
              document.head.appendChild(wasmScript);

              await new Promise((resolve, reject) => {
                wasmScript.onload = () => {
                  console.log('Runtime Bridge: wasm_exec.js loaded successfully');
                  resolve();
                };
                wasmScript.onerror = (error) => {
                  console.error('Runtime Bridge: Failed to load wasm_exec.js:', error);
                  reject(error);
                };
                
                setTimeout(() => {
                  reject(new Error('wasm_exec.js load timeout'));
                }, 15000);
              });

              console.log('Runtime Bridge: Initializing Go...');
              const go = new Go();
              
              console.log('Runtime Bridge: Converting base64 WASM data to bytes...');
              
              // Convert base64 to bytes
              const binaryString = atob(wasmBase64Data);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              console.log(\`Runtime Bridge: WASM size: \${bytes.byteLength} bytes\`);
              
              console.log('Runtime Bridge: Instantiating WASM module...');
              const result = await WebAssembly.instantiate(bytes, go.importObject);
              console.log('Runtime Bridge: WASM module instantiated successfully');
              
              console.log('Runtime Bridge: Running Go program...');
              go.run(result.instance);
              console.log('Runtime Bridge: Go program started');
              
              // Wait for functions to be available
              let attempts = 0;
              const maxAttempts = 100;
              const checkFunctions = () => {
                attempts++;
                console.log(\`Runtime Bridge: Checking for WASM functions (attempt \${attempts}/\${maxAttempts})...\`);
                
                const hasYamlToDot = typeof window.yamlToDot === 'function';
                const hasValidateYaml = typeof window.validateYaml === 'function';
                const hasGetTemplates = typeof window.getTemplates === 'function';
                
                console.log(\`Runtime Bridge: Functions status - yamlToDot: \${hasYamlToDot}, validateYaml: \${hasValidateYaml}, getTemplates: \${hasGetTemplates}\`);
                
                if (hasYamlToDot && hasValidateYaml && hasGetTemplates) {
                  console.log('Runtime Bridge: All WASM functions are ready!');
                  sendMessage('ready', 'WASM loaded successfully');
                } else if (attempts < maxAttempts) {
                  setTimeout(checkFunctions, 100);
                } else {
                  const error = \`WASM functions not available after \${maxAttempts} attempts. Available functions: \${Object.keys(window).filter(k => k.startsWith('yaml') || k.startsWith('validate') || k.startsWith('get')).join(', ')}\`;
                  console.error('Runtime Bridge:', error);
                  throw new Error(error);
                }
              };
              
              setTimeout(checkFunctions, 100);
              
            } catch (error) {
              console.error('Runtime Bridge loading error:', error);
              sendMessage('error', error.toString());
            }
          }

          // Signal that WebView is ready to receive WASM data
          console.log('Runtime Bridge: WebView ready, signaling to React Native...');
          sendMessage('webviewReady', 'WebView loaded and ready for WASM data');
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
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
        mixedContentMode="compatibility"
        style={{ flex: 1 }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('Runtime WebView error:', nativeEvent);
          props.onError(`WebView error: ${nativeEvent.description}`);
        }}
        onLoadStart={() => console.log('Runtime WebView: Load started')}
        onLoadEnd={() => console.log('Runtime WebView: Load ended')}
      />
    </View>
  );
});

export default WasmBridgeRuntime;
export type { WasmBridgeRef }; 
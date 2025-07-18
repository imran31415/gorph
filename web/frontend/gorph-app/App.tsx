import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform, ScrollView, Animated, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import Header from './src/components/Header';
import LoadingScreen from './src/components/LoadingScreen';
import YamlEditor from './src/components/YamlEditor';
import DotOutput from './src/components/DotOutput';
import DiagramViewer from './src/components/DiagramViewer';
import WasmBridge, { WasmBridgeRef } from './src/components/WasmBridge';
import WasmBridgeSimple from './src/components/WasmBridgeSimple';
import WasmBridgeRuntime from './src/components/WasmBridgeRuntime';

// WASM interface types
interface WasmResult {
  dot?: string;
  error?: string;
  status?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Global WASM functions (loaded from WASM module)
declare global {
  interface Window {
    yamlToDot: (yaml: string) => WasmResult;
    validateYaml: (yaml: string) => ValidationResult;
    getTemplates: () => Record<string, string>;
    Go: any;
    goWasm: any;
  }
}

export default function App() {
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [wasmError, setWasmError] = useState<string | null>(null);
  const [yamlInput, setYamlInput] = useState('');
  const [dotOutput, setDotOutput] = useState('');
  const [svgOutput, setSvgOutput] = useState('');
  const [activeTab, setActiveTab] = useState<'yaml' | 'dot' | 'diagram'>('yaml');
  const [isLandscape, setIsLandscape] = useState(false);
  
  // Pane visibility state for desktop layout
  const [visiblePanes, setVisiblePanes] = useState({
    yaml: true,
    dot: true,
    diagram: true
  });

  // Function to expand a pane (hide others)
  const expandPane = (paneName: 'yaml' | 'dot' | 'diagram') => {
    setVisiblePanes({
      yaml: paneName === 'yaml',
      dot: paneName === 'dot', 
      diagram: paneName === 'diagram'
    });
  };

  // Function to minimize (show all panes)
  const minimizePanes = () => {
    setVisiblePanes({
      yaml: true,
      dot: true,
      diagram: true
    });
  };

  // Animation values for smooth transitions
  const [animations] = useState({
    yaml: new Animated.Value(1),
    dot: new Animated.Value(1),
    diagram: new Animated.Value(1)
  });

  // WebView bridge ref for mobile WASM
  const wasmBridgeRef = useRef<WasmBridgeRef>(null);
  const [useSimpleBridge, setUseSimpleBridge] = useState(false);

  // Responsive layout detection
  useEffect(() => {
    const updateLayout = () => {
      const { width, height } = Dimensions.get('window');
      setIsLandscape(width > height && width > 768);
    };

    updateLayout();
    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription?.remove();
  }, []);

  // WASM Loading
  useEffect(() => {
    if (Platform.OS === 'web') {
      loadWasm();
    } else {
      // Mobile will use WebView bridge - mark as loaded immediately
      // The actual loading happens in the WebView bridge
      setWasmLoaded(true);
    }
  }, []);

  // Handle WebView bridge ready
  const handleBridgeReady = () => {
    console.log(`${useSimpleBridge ? 'Simple' : 'Runtime WASM'} bridge ready`);
    setWasmError(''); // Clear any error messages
    loadDefaultTemplate();
  };

  // Handle WebView bridge error
  const handleBridgeError = (error: string) => {
    console.error('WebView bridge error:', error);
    
    if (!useSimpleBridge) {
      console.log('Runtime WASM bridge failed, switching to simple bridge fallback');
      setUseSimpleBridge(true);
      setWasmError(''); // Clear error since we're trying fallback
    } else {
      setWasmError(`Bridge error: ${error}`);
    }
  };

  // Process YAML when input changes
  useEffect(() => {
    if (wasmLoaded && yamlInput.trim()) {
      if (Platform.OS === 'web') {
        // Use direct WASM on web
        try {
          const result = window.yamlToDot(yamlInput);
          if (result.error) {
            setDotOutput(`Error: ${result.error}`);
            setSvgOutput('');
          } else if (result.dot) {
            setDotOutput(result.dot);
            generateSVG(result.dot);
          }
        } catch (error) {
          setDotOutput(`Error: ${error}`);
          setSvgOutput('');
        }
      } else {
        // Use WebView bridge on mobile
        if (wasmBridgeRef.current) {
          wasmBridgeRef.current.yamlToDot(yamlInput)
            .then((result) => {
              if (result.error) {
                setDotOutput(`Error: ${result.error}`);
                setSvgOutput('');
              } else if (result.dot) {
                setDotOutput(result.dot);
                generateSVG(result.dot);
              }
            })
            .catch((error) => {
              setDotOutput(`Error: ${error}`);
              setSvgOutput('');
            });
        } else {
          // Fallback to simple converter if bridge not ready
          try {
            const dotResult = simpleMobileYamlToDot(yamlInput);
            setDotOutput(dotResult);
            setSvgOutput('');
          } catch (error) {
            setDotOutput(`Error: ${error}`);
            setSvgOutput('');
          }
        }
      }
    }
  }, [yamlInput, wasmLoaded]);

  const loadWasm = async () => {
    try {
      console.log('Loading WASM module...');
      
      // Add cache busting
      const timestamp = Date.now();
      
      // Check if wasm_exec.js is already loaded
      if (!window.Go) {
        console.log('Loading wasm_exec.js...');
        const wasmScript = document.createElement('script');
        wasmScript.src = `/wasm_exec.js?t=${timestamp}`;
        document.head.appendChild(wasmScript);

        await new Promise((resolve, reject) => {
          wasmScript.onload = () => {
            console.log('wasm_exec.js loaded successfully');
            resolve(true);
          };
          wasmScript.onerror = (error) => {
            console.error('Failed to load wasm_exec.js:', error);
            reject(error);
          };
        });
      }

      console.log('Initializing Go WASM...');
      const go = new window.Go();
      
      // Load and instantiate the WASM module with cache busting
      console.log('Fetching WASM module...');
      const response = await fetch(`/gorph.wasm?t=${timestamp}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch WASM: ${response.status}`);
      }
      
      const bytes = await response.arrayBuffer();
      console.log('Instantiating WASM module...');
      const result = await WebAssembly.instantiate(bytes, go.importObject);
      
      console.log('Starting Go program...');
      // Run the Go program in a promise to catch any immediate errors
      try {
        go.run(result.instance);
        console.log('Go program started successfully');
      } catch (error) {
        console.error('Go program failed to start:', error);
        throw error;
      }
      
      // Wait for functions to be available with better logging
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds total
      
      const checkFunctions = () => {
        console.log(`Checking for WASM functions (attempt ${attempts + 1})...`);
        console.log('Available functions:', {
          yamlToDot: !!window.yamlToDot,
          validateYaml: !!window.validateYaml,
          getTemplates: !!window.getTemplates
        });
        
        if (window.yamlToDot && window.validateYaml && window.getTemplates) {
          console.log('All WASM functions available!');
          setWasmLoaded(true);
          loadDefaultTemplate();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkFunctions, 100);
        } else {
          const error = `WASM functions not available after ${maxAttempts} attempts. Available: yamlToDot=${!!window.yamlToDot}, validateYaml=${!!window.validateYaml}, getTemplates=${!!window.getTemplates}`;
          console.error(error);
          setWasmError(error);
        }
      };
      
      setTimeout(checkFunctions, 100);
      
    } catch (error) {
      console.error('WASM loading error:', error);
      setWasmError(`WASM loading failed: ${error.message || error}`);
    }
  };

  const loadDefaultTemplate = async () => {
    try {
      console.log('Loading default template...');
      if (Platform.OS === 'web' && window.getTemplates) {
        console.log('getTemplates function available');
        const templates = window.getTemplates();
        console.log('Templates returned:', templates);
        
        if (templates && typeof templates === 'object' && templates.simple) {
          console.log('Setting simple template');
          setYamlInput(templates.simple);
        } else {
          console.log('No simple template found, using fallback');
          setYamlInput(getFallbackTemplate());
        }
      } else if (Platform.OS !== 'web' && wasmBridgeRef.current) {
        // Use WebView bridge for mobile
        try {
          console.log('Getting templates from WebView bridge...');
          const templates = await wasmBridgeRef.current.getTemplates();
          
          if (templates && typeof templates === 'object' && templates.simple) {
            console.log('Setting template from bridge');
            setYamlInput(templates.simple);
          } else {
            console.log('No simple template from bridge, using fallback');
            setYamlInput(getFallbackTemplate());
          }
        } catch (error) {
          console.error('Error getting templates from bridge:', error);
          setYamlInput(getFallbackTemplate());
        }
      } else {
        console.log('Using fallback template');
        setYamlInput(getFallbackTemplate());
      }
    } catch (error) {
      console.error('Error in loadDefaultTemplate:', error);
      setYamlInput(getFallbackTemplate());
    }
  };

  const getFallbackTemplate = () => {
    return `entities:
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
    attributes:
      language: Go

  - id: Database
    category: DATABASE
    description: "SQLite database"
    status: degraded
    owner: ops
    environment: production
    attributes:
      engine: SQLite

connections:
  - from: Client
    to: WebServer
    type: HTTP_Request
  - from: WebServer
    to: Database
    type: DB_Connection`;
  };



  // Simple mobile YAML to DOT converter
  const simpleMobileYamlToDot = (yamlStr: string): string => {
    try {
      // Basic YAML parsing for mobile fallback
      const lines = yamlStr.split('\n');
      const entities: any[] = [];
      const connections: any[] = [];
      let currentSection = '';
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('entities:')) {
          currentSection = 'entities';
        } else if (trimmed.startsWith('connections:')) {
          currentSection = 'connections';
        } else if (trimmed.startsWith('- id:') && currentSection === 'entities') {
          const id = trimmed.split('id:')[1].trim();
          entities.push({ id });
        } else if (trimmed.startsWith('from:') && currentSection === 'connections') {
          const from = trimmed.split('from:')[1].trim();
          const nextLine = lines[lines.indexOf(line) + 1];
          const to = nextLine?.trim().startsWith('to:') ? nextLine.split('to:')[1].trim() : '';
          if (from && to) {
            connections.push({ from, to });
          }
        }
      }
      
      // Generate simple DOT
      let dot = 'digraph Infrastructure {\n';
      dot += '  rankdir=LR;\n';
      dot += '  node [shape=box, style=filled, fillcolor=lightblue];\n\n';
      
      // Add entities
      entities.forEach(entity => {
        dot += `  "${entity.id}" [label="${entity.id}"];\n`;
      });
      
      dot += '\n';
      
      // Add connections
      connections.forEach(conn => {
        dot += `  "${conn.from}" -> "${conn.to}";\n`;
      });
      
      dot += '}\n';
      return dot;
      
    } catch (error) {
      throw new Error(`Failed to parse YAML: ${error}`);
    }
  };

  const generateSVG = async (dotCode: string) => {
    if (Platform.OS === 'web') {
      // Web platforms can use more complex libraries if needed
      setSvgOutput('');
      return;
    }
    
    // Mobile: Use external service to generate SVG from DOT
    try {
      console.log('Generating SVG from DOT code...');
      const response = await fetch('https://quickchart.io/graphviz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graph: dotCode,
          format: 'svg'
        }),
      });
      
      if (response.ok) {
        const svgText = await response.text();
        setSvgOutput(svgText);
        console.log('SVG generated successfully');
      } else {
        console.error('Failed to generate SVG:', response.status);
        setSvgOutput('');
      }
    } catch (error) {
      console.error('Error generating SVG:', error);
      setSvgOutput('');
    }
  };

  if (!wasmLoaded) {
    return <LoadingScreen error={wasmError} />;
  }

  // Mobile: Tabbed interface
  if (!isLandscape) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Header 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showTabs={true}
        />
        
        <View style={styles.mobileContent}>
          {activeTab === 'yaml' && (
            <YamlEditor
              value={yamlInput}
              onChange={setYamlInput}
              style={styles.fullPane}
            />
          )}
          
          {activeTab === 'dot' && (
            <DotOutput
              value={dotOutput}
              style={styles.fullPane}
            />
          )}
          
          {activeTab === 'diagram' && (
            <DiagramViewer
              svg={svgOutput}
              dotContent={dotOutput}
              style={styles.fullPane}
            />
          )}
        </View>
        
        {/* WebView bridge for mobile WASM */}
        {!useSimpleBridge ? (
          <WasmBridgeRuntime
            key="runtime-wasm-bridge"
            ref={wasmBridgeRef}
            onReady={handleBridgeReady}
            onError={handleBridgeError}
          />
        ) : (
          <WasmBridgeSimple
            key="simple-bridge"
            ref={wasmBridgeRef}
            onReady={handleBridgeReady}
            onError={handleBridgeError}
          />
        )}
      </View>
    );
  }

  // Desktop: 3-pane layout
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Header 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showTabs={false}
      />
      
      {/* Hidden pane restore buttons */}
      {(!visiblePanes.yaml || !visiblePanes.dot || !visiblePanes.diagram) && (
        <View style={styles.restoreBar}>
          {!visiblePanes.yaml && (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => setVisiblePanes(prev => ({ ...prev, yaml: true }))}
            >
              <Text style={styles.restoreButtonText}>📝 YAML</Text>
            </TouchableOpacity>
          )}
          {!visiblePanes.dot && (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => setVisiblePanes(prev => ({ ...prev, dot: true }))}
            >
              <Text style={styles.restoreButtonText}>🔗 DOT</Text>
            </TouchableOpacity>
          )}
          {!visiblePanes.diagram && (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => setVisiblePanes(prev => ({ ...prev, diagram: true }))}
            >
              <Text style={styles.restoreButtonText}>📊 Diagram</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      <View style={styles.threePane}>
        {visiblePanes.yaml && (
          <Animated.View style={[
            styles.leftPane, 
            { 
              flex: visiblePanes.yaml && !visiblePanes.dot && !visiblePanes.diagram ? 1 : 
                    visiblePanes.yaml ? 1 : 0,
              minHeight: 0
            }
          ]}>
            <YamlEditor
              value={yamlInput}
              onChange={setYamlInput}
              style={{ flex: 1, minHeight: 0 }}
              onTogglePane={() => {
                if (visiblePanes.yaml && visiblePanes.dot && visiblePanes.diagram) {
                  // All panes visible, expand this one
                  expandPane('yaml');
                } else {
                  // Some panes hidden, minimize (show all)
                  minimizePanes();
                }
              }}
              isExpanded={visiblePanes.yaml && !visiblePanes.dot && !visiblePanes.diagram}
              canExpand={visiblePanes.dot || visiblePanes.diagram}
            />
          </Animated.View>
        )}
        
        {visiblePanes.dot && (
          <Animated.View style={[
            styles.middlePane, 
            { 
              flex: visiblePanes.dot && !visiblePanes.yaml && !visiblePanes.diagram ? 1 : 
                    visiblePanes.dot ? 1 : 0,
              minHeight: 0
            }
          ]}>
            <DotOutput
              value={dotOutput}
              style={{ flex: 1, minHeight: 0 }}
              onTogglePane={() => {
                if (visiblePanes.yaml && visiblePanes.dot && visiblePanes.diagram) {
                  // All panes visible, expand this one
                  expandPane('dot');
                } else {
                  // Some panes hidden, minimize (show all)
                  minimizePanes();
                }
              }}
              isExpanded={visiblePanes.dot && !visiblePanes.yaml && !visiblePanes.diagram}
              canExpand={visiblePanes.yaml || visiblePanes.diagram}
            />
          </Animated.View>
        )}
        
        {visiblePanes.diagram && (
          <Animated.View style={[
            styles.rightPane, 
            { 
              flex: visiblePanes.diagram && !visiblePanes.yaml && !visiblePanes.dot ? 1 : 
                    visiblePanes.diagram ? 1 : 0,
              minHeight: 0
            }
          ]}>
            <DiagramViewer
              svg={svgOutput}
              dotContent={dotOutput}
              style={{ flex: 1, minHeight: 0 }}
              onTogglePane={() => {
                if (visiblePanes.yaml && visiblePanes.dot && visiblePanes.diagram) {
                  // All panes visible, expand this one
                  expandPane('diagram');
                } else {
                  // Some panes hidden, minimize (show all)
                minimizePanes();
              }
            }}
            isExpanded={visiblePanes.diagram && !visiblePanes.yaml && !visiblePanes.dot}
            canExpand={visiblePanes.yaml || visiblePanes.dot}
            />
          </Animated.View>
        )}
      </View>
      
      {/* WebView bridge for mobile WASM */}
      {!useSimpleBridge ? (
        <WasmBridgeRuntime
          key="runtime-wasm-bridge"
          ref={wasmBridgeRef}
          onReady={handleBridgeReady}
          onError={handleBridgeError}
        />
      ) : (
        <WasmBridgeSimple
          key="simple-bridge"
          ref={wasmBridgeRef}
          onReady={handleBridgeReady}
          onError={handleBridgeError}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  threePane: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0, // Allow flex shrinking
  },
  leftPane: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    minHeight: 0, // Allow flex shrinking
  },
  middlePane: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    minHeight: 0, // Allow flex shrinking
  },
  rightPane: {
    flex: 1,
    backgroundColor: '#ffffff',
    minHeight: 0, // Allow flex shrinking
  },
  fullPane: {
    flex: 1,
  },
  mobileContent: {
    flex: 1,
    minHeight: 0, // Allow flex shrinking
    backgroundColor: '#ffffff',
  },
  restoreBar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  restoreButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  restoreButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});

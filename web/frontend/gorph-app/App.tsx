import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform, ScrollView, Animated, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import Header from './src/components/Header';
import LoadingScreen from './src/components/LoadingScreen';
import YamlEditor from './src/components/YamlEditor';
import DotOutput from './src/components/DotOutput';
import DiagramViewer from './src/components/DiagramViewer';

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
      // For mobile, WASM isn't supported, but we can still show the interface
      setWasmLoaded(true);
    }
  }, []);

  // Process YAML when input changes
  useEffect(() => {
    if (wasmLoaded && yamlInput.trim() && Platform.OS === 'web') {
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

  const loadDefaultTemplate = () => {
    try {
      console.log('Loading default template...');
      if (window.getTemplates) {
        console.log('getTemplates function available');
        const templates = window.getTemplates();
        console.log('Templates returned:', templates);
        
        if (templates && typeof templates === 'object' && templates.simple) {
          console.log('Setting simple template');
          setYamlInput(templates.simple);
        } else {
          console.log('No simple template found, using fallback');
          // Fallback template
          setYamlInput(`entities:
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
    type: DB_Connection`);
        }
      } else {
        console.log('getTemplates function not available');
      }
    } catch (error) {
      console.error('Error in loadDefaultTemplate:', error);
    }
  };

  const generateSVG = async (dotCode: string) => {
    // Note: SVG generation removed due to Metro bundler issues with GraphViz libraries
    // DiagramViewer now shows instructions for external visualization
    setSvgOutput('');
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
          <Animated.View style={[styles.leftPane, { flex: visiblePanes.yaml ? 1 : 0 }]}>
            <YamlEditor
              value={yamlInput}
              onChange={setYamlInput}
              style={{ flex: 1 }}
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
          <Animated.View style={[styles.middlePane, { flex: visiblePanes.dot ? 1 : 0 }]}>
            <DotOutput
              value={dotOutput}
              style={{ flex: 1 }}
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
          <Animated.View style={[styles.rightPane, { flex: visiblePanes.diagram ? 1 : 0 }]}>
            <DiagramViewer
              svg={svgOutput}
              dotContent={dotOutput}
              style={{ flex: 1 }}
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
  },
  leftPane: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  middlePane: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  rightPane: {
    flex: 1,
    backgroundColor: '#ffffff',
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

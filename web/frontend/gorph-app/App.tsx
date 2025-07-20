import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform, ScrollView, Animated, TouchableOpacity, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Header from './src/components/Header';
import Footer from './src/components/Footer';
import LoadingScreen from './src/components/LoadingScreen';
import YamlEditor from './src/components/YamlEditor';
import DotOutput from './src/components/DotOutput';
import DiagramViewer from './src/components/DiagramViewer';
import Builder from './src/components/Builder';
import WasmBridge, { WasmBridgeRef } from './src/components/WasmBridge';
import WasmBridgeSimple from './src/components/WasmBridgeSimple';
import WasmBridgeRuntime from './src/components/WasmBridgeRuntime';
import { DiagramStateProvider, useDiagramState } from './src/components/DiagramStateManager';
import DiagramHeader from './src/components/DiagramHeader';
import HistoryViewer from './src/components/HistoryViewer';
import OnboardingModal from './src/components/OnboardingModal';
import TemplateModal from './src/components/TemplateModal';

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

function AppInner() {
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [wasmError, setWasmError] = useState<string | null>(null);
  const [dotOutput, setDotOutput] = useState('');
  const [svgOutput, setSvgOutput] = useState('');
  const [activeTab, setActiveTab] = useState<'yaml' | 'dot' | 'diagram' | 'builder'>('builder');
  const [isLandscape, setIsLandscape] = useState(false);
  const [templates, setTemplates] = useState<Record<string, any>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const templateModalStateRef = useRef(false);
  
  // Sync ref with state
  useEffect(() => {
    templateModalStateRef.current = showTemplateModal;
  }, [showTemplateModal]);
  
  // Debug template modal state changes
  useEffect(() => {
    console.log('📋 Template Modal state changed:', showTemplateModal, 'isLandscape:', isLandscape);
  }, [showTemplateModal, isLandscape]);
  const initializedRef = useRef(false);
  // Diagram state management
  const {
    activeDiagram,
    session,
    createNewDiagram,
    updateYaml,
    renameDiagram,
    switchToDiagram,
  } = useDiagramState();

  // Get current YAML from active diagram
  const yamlInput = activeDiagram?.currentYaml || '';
  
  // Function to update YAML with change tracking
  const setYamlInput = (newYaml: string, changeType: 'manual' | 'template' | 'builder' = 'manual', description?: string) => {
    updateYaml(newYaml, changeType, description || '');
  };

  // Track diagram count to prevent infinite loops
  const diagramCount = Object.keys(session.diagrams).length;
  const prevDiagramCountRef = useRef(diagramCount);
  
  // Track onboarding state for diagram switching
  const onboardingNewDiagramRef = useRef<string | null>(null);

  // Monitor diagram creation during onboarding and ensure proper switching
  useEffect(() => {
    if (onboardingNewDiagramRef.current && session.diagrams[onboardingNewDiagramRef.current]) {
      const expectedDiagramId = onboardingNewDiagramRef.current;
      
      console.log('📊 Onboarding: Monitoring diagram creation effect triggered:', {
        expectedDiagramId,
        currentActiveDiagramId: session.activeDiagramId,
        currentActiveDiagramName: activeDiagram?.name,
        diagramExists: !!session.diagrams[expectedDiagramId],
        diagramName: session.diagrams[expectedDiagramId]?.name
      });
      
      if (session.activeDiagramId !== expectedDiagramId) {
        console.log('🔄 Onboarding: useEffect forcing diagram switch to:', expectedDiagramId);
        switchToDiagram(expectedDiagramId);
        setActiveTab('diagram');
      }
      
      // Clear the ref once we've handled it
      onboardingNewDiagramRef.current = null;
    }
  }, [session.diagrams, session.activeDiagramId, activeDiagram?.name, switchToDiagram]);

  // Check for first-time user and initialize onboarding
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('gorph_onboarding_completed');
        const hasExistingDiagrams = diagramCount > 0;
        
        console.log('First-time user check:', {
          hasSeenOnboarding: !!hasSeenOnboarding,
          hasExistingDiagrams,
          diagramCount,
          wasmLoaded,
          sessionStartTime: session.sessionStartTime
        });
        
        if (!hasSeenOnboarding && !hasExistingDiagrams && wasmLoaded && session.sessionStartTime > 0) {
          console.log('🎯 Showing onboarding for first-time user');
          setIsFirstTime(true);
          setShowOnboarding(true);
        } else {
          console.log('❌ Onboarding not shown because:', {
            hasSeenOnboarding: !!hasSeenOnboarding,
            hasExistingDiagrams,
            wasmLoaded,
            sessionStartTime: session.sessionStartTime
          });
        }
      } catch (error) {
        console.error('Error checking first-time user:', error);
      }
    };
    
    // Check immediately when WASM loads and session is ready
    if (wasmLoaded && session.sessionStartTime > 0) {
      checkFirstTimeUser();
    }
  }, [wasmLoaded, diagramCount, session.sessionStartTime]);

  // Initialize diagram for returning users (not first-time users)
  useEffect(() => {
    const initializeForReturningUser = async () => {
      try {
        const hasSeenOnboarding = await AsyncStorage.getItem('gorph_onboarding_completed');
        
        console.log('Returning user initialization check:', {
          initialized: initializedRef.current,
          diagramCount,
          sessionStartTime: session.sessionStartTime,
          hasSeenOnboarding: !!hasSeenOnboarding,
          wasmLoaded,
          isFirstTime,
          showOnboarding
        });
        
        // Only auto-create diagram for returning users
        if (!initializedRef.current && 
            diagramCount === 0 && 
            session.sessionStartTime > 0 && 
            hasSeenOnboarding && 
            wasmLoaded && 
            !isFirstTime && 
            !showOnboarding) {
          console.log('Creating welcome diagram for returning user...');
          initializedRef.current = true;
          createNewDiagram('Welcome Diagram', '');
          loadDefaultTemplate();
        }
      } catch (error) {
        console.error('Error checking returning user:', error);
      }
    };
    
    if (wasmLoaded && session.sessionStartTime > 0) {
      initializeForReturningUser();
    }
    
    prevDiagramCountRef.current = diagramCount;
  }, [diagramCount, session.sessionStartTime, createNewDiagram, isFirstTime, showOnboarding, wasmLoaded]);
  
  // Validation states for each pane
  type ValidationStatus = 'valid' | 'invalid' | 'pending' | 'empty';
  const [validationStates, setValidationStates] = useState<{
    yaml: ValidationStatus;
    dot: ValidationStatus;
    diagram: ValidationStatus;
    builder: ValidationStatus;
  }>({
    yaml: 'empty',
    dot: 'empty',
    diagram: 'empty',
    builder: 'empty'
  });
  
  const [validationErrors, setValidationErrors] = useState<{
    yaml: string | null;
    dot: string | null;
    diagram: string | null;
    builder: string | null;
  }>({
    yaml: null,
    dot: null,
    diagram: null,
    builder: null
  });
  
  // Pane visibility state for desktop layout
  const [visiblePanes, setVisiblePanes] = useState({
    yaml: true,
    dot: false,
    diagram: true,
    builder: true
  });

  // Function to expand a pane (hide others)
  const expandPane = (paneName: 'yaml' | 'dot' | 'diagram' | 'builder') => {
    setVisiblePanes({
      yaml: paneName === 'yaml',
      dot: paneName === 'dot', 
      diagram: paneName === 'diagram',
      builder: paneName === 'builder'
    });
  };

  // Function to minimize (show all panes)
  const minimizePanes = () => {
    setVisiblePanes({
      yaml: true,
      dot: true,
      diagram: true,
      builder: true
    });
  };

  // Function to maximize diagram pane
  const maximizeDiagram = () => {
    expandPane('diagram');
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
      const newIsLandscape = width > height && width > 1200;
      console.log('📋 Layout change detected:', { 
        width, 
        height, 
        newIsLandscape, 
        currentIsLandscape: isLandscape,
        templateModalState: templateModalStateRef.current 
      });
      
      // Preserve template modal state across layout changes
      const wasTemplateModalOpen = templateModalStateRef.current;
      setIsLandscape(newIsLandscape);
      
      // Restore template modal state after layout change
      if (wasTemplateModalOpen && !showTemplateModal) {
        console.log('📋 Restoring template modal state after layout change');
        setShowTemplateModal(true);
      }
    };

    updateLayout();
    const subscription = Dimensions.addEventListener('change', updateLayout);
    return () => subscription?.remove();
  }, [isLandscape, showTemplateModal]);

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
    loadTemplates();
    // Don't load default template - onboarding will handle this
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

  // Load templates from WASM backend
  const loadTemplates = async () => {
    try {
      console.log('Loading templates...');
      let templateData: Record<string, string> = {};
      
      if (Platform.OS === 'web' && typeof window.getTemplates === 'function') {
        console.log('Web platform: calling window.getTemplates()');
        templateData = window.getTemplates();
        console.log('Web platform: getTemplates returned:', Object.keys(templateData));
      } else if (Platform.OS !== 'web' && wasmBridgeRef.current) {
        console.log('Mobile platform: calling wasmBridge.getTemplates()');
        templateData = await wasmBridgeRef.current.getTemplates();
        console.log('Mobile platform: getTemplates returned:', Object.keys(templateData));
      } else {
        console.log('No template source available, using fallback');
      }
      
      // Convert raw YAML strings to template objects with metadata
      const processedTemplates: Record<string, any> = {};
      for (const [key, yaml] of Object.entries(templateData)) {
        processedTemplates[key] = {
          name: getTemplateDisplayName(key),
          description: getTemplateDescription(key),
          yaml: yaml
        };
      }
      
      if (Object.keys(processedTemplates).length > 0) {
        setTemplates(processedTemplates);
        console.log(`Successfully loaded ${Object.keys(processedTemplates).length} templates:`, Object.keys(processedTemplates));
      } else {
        console.log('No templates loaded, using fallback');
        // Set fallback templates
        setTemplates({
          simple: {
            name: 'Simple Web App',
            description: 'A basic web application with client, server, and database',
            yaml: getFallbackTemplate()
          },
          webapp: {
            name: 'Web Application',
            description: 'A full-stack web application with frontend, backend, and database',
            yaml: `entities:
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
    type: DB_Connection`
          }
        });
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      // Set fallback templates
      setTemplates({
        simple: {
          name: 'Simple Web App',
          description: 'A basic web application with client, server, and database',
          yaml: getFallbackTemplate()
        },
        webapp: {
          name: 'Web Application',
          description: 'A full-stack web application with frontend, backend, and database',
          yaml: `entities:
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
    type: DB_Connection`
        }
      });
    }
  };

  // Handle onboarding completion
  const handleOnboardingComplete = async (template: any) => {
    try {
      // Mark onboarding as completed
      await AsyncStorage.setItem('gorph_onboarding_completed', 'true');
      
      const diagramName = template.name === 'Blank Template' ? 'My Infrastructure' : `${template.name} Diagram`;
      
      // Always create a new diagram during onboarding (don't update existing ones)
      console.log('🆕 Onboarding: Creating new diagram with template:', template.name);
      console.log('📄 Template YAML length:', template.yaml.length);
      console.log('📊 Current active diagram before creation:', activeDiagram?.name || 'None');
      console.log('📊 Current session state before creation:', {
        activeDiagramId: session.activeDiagramId,
        diagramCount: Object.keys(session.diagrams).length
      });
      
      const newDiagramId = createNewDiagram(diagramName, template.yaml);
      console.log('🆕 Onboarding: Created diagram with ID:', newDiagramId);
      
      // Set the ref so useEffect can monitor for this diagram
      onboardingNewDiagramRef.current = newDiagramId;
      
      // Use multiple verification steps with different timings
      const verifyAndSwitch = () => {
        console.log('🔄 Onboarding: Checking current state after creation:', {
          sessionActiveDiagramId: session.activeDiagramId,
          activeDiagramFromHook: activeDiagram?.id,
          activeDiagramName: activeDiagram?.name,
          expectedId: newDiagramId,
          diagramExists: !!session.diagrams[newDiagramId]
        });
        
        // Always force the switch, regardless of what we think the state is
        console.log('🔄 Onboarding: Force switching to new diagram:', newDiagramId);
        switchToDiagram(newDiagramId);
        
        // Switch to diagram tab
        setActiveTab('diagram');
        
        console.log('✅ Onboarding: Forced switch complete');
      };
      
      // Try immediately
      setTimeout(verifyAndSwitch, 10);
      
      // Try again after a longer delay to be absolutely sure
      setTimeout(() => {
        console.log('🔄 Onboarding: Secondary verification after 200ms');
        if (activeDiagram?.id !== newDiagramId) {
          console.log('⚠️ Onboarding: Still not switched, forcing again');
          switchToDiagram(newDiagramId);
        }
      }, 200);
      
      // Close onboarding with a small delay to ensure all state updates propagate
      setTimeout(() => {
        setShowOnboarding(false);
        setIsFirstTime(false);
        console.log('✅ Onboarding completed with template:', template.name);
      }, 100);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  // Handle onboarding skip
  const handleOnboardingSkip = async () => {
    try {
      await AsyncStorage.setItem('gorph_onboarding_completed', 'true');
      setShowOnboarding(false);
      setIsFirstTime(false);
      
      // Create empty diagram for skipped onboarding
      createNewDiagram('My Infrastructure', '');
      
      console.log('Onboarding skipped');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  // Handle template selection from header
  const handleTemplateSelect = (template: any) => {
    const previousYaml = yamlInput;
    setYamlInput(template.yaml, 'template', `Template "${template.name}" applied`);
    setShowTemplateModal(false);
    
    // Switch to diagram tab to show the result
    setActiveTab('diagram');
  };

  // Helper function to get template display names
  const getTemplateDisplayName = (key: string): string => {
    const names: Record<string, string> = {
      'simple': 'Simple Web App',
      'webapp': 'Web Application',
      'microservices': 'Microservices',
      'data-pipeline': 'Data Pipeline',
      'deploy': 'Deployment Pipeline',
      'infra': 'Infrastructure',
      'gorph-app': 'Gorph Application'
    };
    return names[key] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  // Helper function to get template descriptions
  const getTemplateDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      'simple': 'A basic web application with client, server, and database',
      'webapp': 'A full-stack web application with frontend, backend, and database',
      'microservices': 'A microservices architecture with API gateway and multiple services',
      'data-pipeline': 'A data processing pipeline with ETL, streaming, and ML components',
      'deploy': 'A CI/CD deployment pipeline with GitOps and Kubernetes',
      'infra': 'A comprehensive infrastructure setup with multiple environments',
      'gorph-app': 'The architecture of this Gorph infrastructure visualization tool'
    };
    return descriptions[key] || 'Infrastructure template';
  };

  // Process YAML when input changes
  useEffect(() => {
    if (!yamlInput.trim()) {
      // Empty input
      setValidationStates({
        yaml: 'empty',
        dot: 'empty',
        diagram: 'empty',
        builder: 'empty'
      });
      setValidationErrors({
        yaml: null,
        dot: null,
        diagram: null,
        builder: null
      });
      setDotOutput('');
      setSvgOutput('');
      return;
    }

    if (wasmLoaded) {
      // Set pending state
      setValidationStates(prev => ({
        ...prev,
        yaml: 'pending',
        dot: 'pending',
        diagram: 'pending'
      }));

      if (Platform.OS === 'web') {
        // Use direct WASM on web
        try {
          const result = window.yamlToDot(yamlInput);
          if (result.error) {
            setDotOutput(`Error: ${result.error}`);
            setSvgOutput('');
            setValidationStates({
              yaml: 'invalid',
              dot: 'invalid',
              diagram: 'invalid',
              builder: 'invalid'
            });
            setValidationErrors({
              yaml: result.error,
              dot: result.error,
              diagram: 'Cannot generate diagram due to YAML/DOT errors',
              builder: result.error
            });
          } else if (result.dot) {
            setDotOutput(result.dot);
            setValidationStates(prev => ({
              yaml: 'valid',
              dot: 'valid',
              diagram: prev.diagram,
              builder: 'valid'
            }));
            setValidationErrors({
              yaml: null,
              dot: null,
              diagram: null,
              builder: null
            });
            generateSVG(result.dot);
          }
        } catch (error) {
          console.error('Error processing YAML:', error);
          setDotOutput(`Error: ${error}`);
          setSvgOutput('');
          setValidationStates({
            yaml: 'invalid',
            dot: 'invalid',
            diagram: 'invalid',
            builder: 'invalid'

          });
          setValidationErrors({
            yaml: String(error),
            dot: String(error),
            diagram: 'Cannot generate diagram due to YAML/DOT errors',
            builder: 'Cannot generate diagram due to YAML/DOT errors'
          });
        }
      } else {
        // Use WebView bridge for mobile
        if (wasmBridgeRef.current) {
          wasmBridgeRef.current.yamlToDot(yamlInput)
            .then((result: any) => {
              if (result.error) {
                setDotOutput(`Error: ${result.error}`);
                setSvgOutput('');
                setValidationStates({
                  yaml: 'invalid',
                  dot: 'invalid',
                  diagram: 'invalid',
                  builder: 'invalid'
                });
                setValidationErrors({
                  yaml: result.error,
                  dot: result.error,
                  diagram: 'Cannot generate diagram due to YAML/DOT errors',
                  builder: 'Cannot generate builder due to YAML/DOT errors'

                });
              } else if (result.dot) {
                setDotOutput(result.dot);
                setValidationStates(prev => ({
                  yaml: 'valid',
                  dot: 'valid',
                  diagram: prev.diagram,
                  builder: prev.builder
                }));
                setValidationErrors({
                  yaml: null,
                  dot: null,
                  diagram: null,
                  builder: null,
                });
                generateSVG(result.dot);
              }
            })
            .catch((error: any) => {
              console.error('Error processing YAML via bridge:', error);
              setDotOutput(`Error: ${error}`);
              setSvgOutput('');
              setValidationStates({
                yaml: 'invalid',
                dot: 'invalid',
                diagram: 'invalid',
                builder: 'invalid'
              });
              setValidationErrors({
                yaml: String(error),
                dot: String(error),
                diagram: 'Cannot generate diagram due to YAML/DOT errors',
                builder: 'Cannot generate builder due to YAML/DOT errors'
              });
            });
        } else {
          // Fallback to simple parser
          try {
            const dotCode = simpleMobileYamlToDot(yamlInput);
            setDotOutput(dotCode);
            setValidationStates(prev => ({
              yaml: 'valid',
              dot: 'valid',
              diagram: prev.diagram,
              builder: prev.builder
            }));
            setValidationErrors({
              yaml: null,
              dot: null,
              diagram: null,
              builder: null,
            });
            generateSVG(dotCode);
          } catch (error) {
            console.error('Error in simple parser:', error);
            setDotOutput(`Error: ${error}`);
            setSvgOutput('');
            setValidationStates({
              yaml: 'invalid',
              dot: 'invalid',
              diagram: 'invalid',
              builder: 'invalid'
            });
            setValidationErrors({
              yaml: String(error),
              dot: String(error),
              diagram: 'Cannot generate diagram due to YAML/DOT errors',
              builder: 'Cannot generate builder due to YAML/DOT errors'
            });
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
          yamlToDot: typeof window.yamlToDot === 'function',
          validateYaml: typeof window.validateYaml === 'function',
          getTemplates: typeof window.getTemplates === 'function'
        });
        
        if (typeof window.yamlToDot === 'function' && typeof window.validateYaml === 'function' && typeof window.getTemplates === 'function') {
                  console.log('All WASM functions available!');
        setWasmLoaded(true);
        loadTemplates();
        // Don't load default template - onboarding will handle this
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkFunctions, 100);
        } else {
          const error = `WASM functions not available after ${maxAttempts} attempts. Available: yamlToDot=${typeof window.yamlToDot === 'function'}, validateYaml=${typeof window.validateYaml === 'function'}, getTemplates=${typeof window.getTemplates === 'function'}`;
          console.error(error);
          setWasmError(error);
        }
      };
      
      setTimeout(checkFunctions, 100);
      
    } catch (error) {
      console.error('WASM loading error:', error);
      setWasmError(`WASM loading failed: ${error instanceof Error ? error.message : String(error)}`);
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
          setYamlInput(templates.simple, 'template', 'Initial template loaded');
        } else {
          console.log('No simple template found, using fallback');
          setYamlInput(getFallbackTemplate(), 'template', 'Fallback template loaded');
        }
      } else if (Platform.OS !== 'web' && wasmBridgeRef.current) {
        // Use WebView bridge for mobile
        try {
          console.log('Getting templates from WebView bridge...');
          const templates = await wasmBridgeRef.current.getTemplates();
          
          if (templates && typeof templates === 'object' && templates.simple) {
            console.log('Setting template from bridge');
            setYamlInput(templates.simple, 'template', 'Template from bridge');
          } else {
            console.log('No simple template from bridge, using fallback');
            setYamlInput(getFallbackTemplate(), 'template', 'Fallback template from bridge');
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
    
    // Use external service to generate SVG from DOT
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
        setValidationStates(prev => ({
          ...prev,
          diagram: 'valid'
        }));
        setValidationErrors(prev => ({
          ...prev,
          diagram: null
        }));
        console.log('SVG generated successfully');
      } else {
        console.error('Failed to generate SVG:', response.status);
        setSvgOutput('');
        setValidationStates(prev => ({
          ...prev,
          diagram: 'invalid'
        }));
        setValidationErrors(prev => ({
          ...prev,
          diagram: `Failed to generate diagram: HTTP ${response.status}`
        }));
      }
    } catch (error) {
      console.error('Error generating SVG:', error);
      setSvgOutput('');
      setValidationStates(prev => ({
        ...prev,
        diagram: 'invalid'
      }));
      setValidationErrors(prev => ({
        ...prev,
        diagram: `Failed to generate diagram: ${error}`
      }));
    }
  };

  if (!wasmLoaded) {
    return <LoadingScreen error={wasmError} />;
  }

  // Mobile: Tabbed interface
  if (!isLandscape) {
    return (
      <>
        <View style={styles.container}>
          <StatusBar style="auto" />
          <DiagramHeader 
            onShowHistory={() => setShowHistory(true)} 
            onTemplatePress={() => {
              console.log('📋 App.tsx: Mobile DiagramHeader onTemplatePress called - setShowTemplateModal(true)');
              setShowTemplateModal(true);
            }}
          />
        <Header 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          showTabs={true}
          onTemplatePress={() => {
            console.log('📋 Header onTemplatePress called in mobile mode');
            setShowTemplateModal(true);
          }}
          validationStates={validationStates}
          validationErrors={validationErrors}
        />
        
        <View style={styles.mobileContent}>
          {activeTab === 'yaml' && (
            <YamlEditor
              key={`yaml-editor-${activeDiagram?.id}-${activeDiagram?.lastModified}`}
              value={yamlInput}
              onChange={(yaml) => setYamlInput(yaml, 'manual')}
              style={styles.fullPane}
              templates={templates}
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
              key={`diagram-viewer-${activeDiagram?.id}-${activeDiagram?.lastModified}`}
              svg={svgOutput}
              dotContent={dotOutput}
              yamlContent={yamlInput}
              style={styles.fullPane}
            />
          )}
          
          {activeTab === 'builder' && (
            <Builder
              key={`builder-${activeDiagram?.id}-${activeDiagram?.lastModified}`}
              yamlContent={yamlInput}
              onYamlChange={(yaml) => setYamlInput(yaml, 'builder')}
              svgOutput={svgOutput}
              dotOutput={dotOutput}
              templates={templates}
              onTemplatePress={() => setShowTemplateModal(true)}
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
        
        <HistoryViewer
          visible={showHistory}
          onClose={() => setShowHistory(false)}
        />
        
        <OnboardingModal
          visible={showOnboarding}
          onClose={handleOnboardingSkip}
          templates={templates}
          onSelectTemplate={handleOnboardingComplete}
        />

        
        <Footer />
        </View>
        
        {/* Render TemplateModal outside container for mobile */}
        <TemplateModal
          visible={showTemplateModal}
          onClose={() => {
            console.log('📋 App.tsx: TemplateModal onClose called');
            setShowTemplateModal(false);
          }}
          templates={templates}
          onSelectTemplate={handleTemplateSelect}
        />
      </>
    );
  }

  // Desktop: 3-pane layout
  return (
    <>
      <View style={styles.container}>
      <StatusBar style="auto" />
      <DiagramHeader 
        onShowHistory={() => setShowHistory(true)} 
        onTemplatePress={() => setShowTemplateModal(true)}
      />
      <Header 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showTabs={false}
        onTemplatePress={() => setShowTemplateModal(true)}
        validationStates={validationStates}
        validationErrors={validationErrors}
      />
      
      {/* Hidden pane restore buttons */}
      {(!visiblePanes.yaml || !visiblePanes.dot || !visiblePanes.diagram || !visiblePanes.builder) && (
        <View style={styles.restoreBar}>
          {!visiblePanes.builder && (
            <TouchableOpacity
              style={styles.restoreButton}
              onPress={() => setVisiblePanes(prev => ({ ...prev, builder: true }))}
            >
              <Text style={styles.restoreButtonText}>🎛️ Builder</Text>
            </TouchableOpacity>
          )}
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
      
      <View style={styles.fourPane}>
        {/* Builder - Leftmost pane */}
        {visiblePanes.builder && (
          <Animated.View style={[
            styles.leftPane, 
            { 
              flex: visiblePanes.builder && !visiblePanes.yaml && !visiblePanes.dot && !visiblePanes.diagram ? 1 : 
                    visiblePanes.builder ? 1 : 0,
              minHeight: 0
            }
          ]}>
            <Builder
              key={`builder-desktop-${activeDiagram?.id}-${activeDiagram?.lastModified}`}
              yamlContent={yamlInput}
              onYamlChange={(yaml) => setYamlInput(yaml, 'builder')}
              svgOutput={svgOutput}
              dotOutput={dotOutput}
              onTogglePane={() => {
                if (visiblePanes.builder && !visiblePanes.yaml && !visiblePanes.dot && !visiblePanes.diagram) {
                  // This pane is already maximized, show all panes
                  minimizePanes();
                } else {
                  // Maximize this pane (hide others)
                  expandPane('builder');
                }
              }}
              onMinimizePane={() => setVisiblePanes(prev => ({ ...prev, builder: false }))}
              isExpanded={visiblePanes.builder && !visiblePanes.yaml && !visiblePanes.dot && !visiblePanes.diagram}
              canExpand={visiblePanes.yaml || visiblePanes.dot || visiblePanes.diagram}
              templates={templates}
              onTemplatePress={() => setShowTemplateModal(true)}
            />
          </Animated.View>
        )}
        
        {/* YAML Editor - Second pane */}
        {visiblePanes.yaml && (
          <Animated.View style={[
            styles.middlePane, 
            { 
              flex: visiblePanes.yaml && !visiblePanes.dot && !visiblePanes.diagram && !visiblePanes.builder ? 1 : 
                    visiblePanes.yaml ? 1 : 0,
              minHeight: 0
            }
          ]}>
            <YamlEditor
              key={`yaml-editor-desktop-${activeDiagram?.id}-${activeDiagram?.lastModified}`}
              value={yamlInput}
              onChange={(yaml) => setYamlInput(yaml, 'manual')}
              style={{ flex: 1, minHeight: 0 }}
              onTogglePane={() => {
                if (visiblePanes.yaml && !visiblePanes.builder && !visiblePanes.dot && !visiblePanes.diagram) {
                  // This pane is already maximized, show all panes
                  minimizePanes();
                } else {
                  // Maximize this pane (hide others)
                  expandPane('yaml');
                }
              }}
              onMinimizePane={() => setVisiblePanes(prev => ({ ...prev, yaml: false }))}
              isExpanded={visiblePanes.yaml && !visiblePanes.dot && !visiblePanes.diagram && !visiblePanes.builder}
              canExpand={visiblePanes.dot || visiblePanes.diagram || visiblePanes.builder}
              templates={templates}
            />
          </Animated.View>
        )}
        
        {/* DOT Output - Third pane */}
        {visiblePanes.dot && (
          <Animated.View style={[
            styles.middlePane, 
            { 
              flex: visiblePanes.dot && !visiblePanes.yaml && !visiblePanes.diagram && !visiblePanes.builder ? 1 : 
                    visiblePanes.dot ? 1 : 0,
              minHeight: 0
            }
          ]}>
            <DotOutput
              value={dotOutput}
              style={{ flex: 1, minHeight: 0 }}
              onTogglePane={() => {
                if (visiblePanes.dot && !visiblePanes.yaml && !visiblePanes.builder && !visiblePanes.diagram) {
                  // This pane is already maximized, show all panes
                  minimizePanes();
                } else {
                  // Maximize this pane (hide others)
                  expandPane('dot');
                }
              }}
              onMinimizePane={() => setVisiblePanes(prev => ({ ...prev, dot: false }))}
              isExpanded={visiblePanes.dot && !visiblePanes.yaml && !visiblePanes.diagram && !visiblePanes.builder}
              canExpand={visiblePanes.yaml || visiblePanes.diagram || visiblePanes.builder}
            />
          </Animated.View>
        )}
        
        {/* Diagram Viewer - Rightmost pane */}
        {visiblePanes.diagram && (
          <Animated.View style={[
            styles.rightPane, 
            { 
              flex: visiblePanes.diagram && !visiblePanes.yaml && !visiblePanes.dot && !visiblePanes.builder ? 1 : 
                    visiblePanes.diagram ? 1 : 0,
              minHeight: 0
            }
          ]}>
            <DiagramViewer
              key={`diagram-viewer-desktop-${activeDiagram?.id}-${activeDiagram?.lastModified}`}
              svg={svgOutput}
              dotContent={dotOutput}
              yamlContent={yamlInput}
              style={{ flex: 1, minHeight: 0 }}
                            onTogglePane={() => {
                if (visiblePanes.diagram && !visiblePanes.yaml && !visiblePanes.dot && !visiblePanes.builder) {
                  // This pane is already maximized, show all panes
                  minimizePanes();
                } else {
                  // Maximize this pane (hide others)
                  expandPane('diagram');
                }
              }}
            onMinimizePane={() => setVisiblePanes(prev => ({ ...prev, diagram: false }))}
            isExpanded={visiblePanes.diagram && !visiblePanes.yaml && !visiblePanes.dot && !visiblePanes.builder}
            canExpand={visiblePanes.yaml || visiblePanes.dot || visiblePanes.builder}
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
      
      <HistoryViewer
        visible={showHistory}
        onClose={() => setShowHistory(false)}
      />
      
      <OnboardingModal
        visible={showOnboarding}
        onClose={handleOnboardingSkip}
        templates={templates}
        onSelectTemplate={handleOnboardingComplete}
      />
      
      <Footer />
      </View>
      
      {/* Render TemplateModal outside container for desktop */}
      <TemplateModal
        visible={showTemplateModal}
        onClose={() => {
          console.log('📋 App.tsx: TemplateModal onClose called');
          setShowTemplateModal(false);
        }}
        templates={templates}
        onSelectTemplate={handleTemplateSelect}
      />
    </>
  );
}

// Main App component with provider
export default function App() {
  return (
    <DiagramStateProvider>
      <AppInner />
    </DiagramStateProvider>
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
  fourPane: {
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
  builderPane: {
    flex: 1,
    backgroundColor: '#f8fafc',
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

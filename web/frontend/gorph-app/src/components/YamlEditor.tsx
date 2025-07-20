import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, Dimensions } from 'react-native';
import SuccessTooltip from './SuccessTooltip';
import { ideTheme } from '../theme/ideTheme';

interface YamlEditorProps {
  value: string;
  onChange: (text: string) => void;
  style?: any;
  onTogglePane?: () => void;
  onMinimizePane?: () => void;
  isExpanded?: boolean;
  canExpand?: boolean;
  templates?: Record<string, any>;
}

// Templates will be loaded from the Go WASM backend
const templates: Record<string, any> = {};

// Isolated text editor component that prevents re-render issues
// Create a stable reference to prevent re-renders
let globalChangeCallback: ((value: string) => void) | null = null;

const TrulyIsolatedEditor = memo(() => {
  const [localValue, setLocalValue] = useState('');
  const textInputRef = useRef<TextInput>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializeRef = useRef<((value: string) => void) | null>(null);

  // Initialize method that can be called from parent
  useEffect(() => {
    (window as any).yamlEditorController = {
      setValue: (value: string) => {
        console.log('🎯 TrulyIsolatedEditor: setValue called with:', value?.substring(0, 50) + '...');
        console.log('🎯 TrulyIsolatedEditor: New content lines:', (value || '').split('\n').length);
        if (localValue === '' || localValue !== value) {
          console.log('🎯 TrulyIsolatedEditor: Actually setting value');
          setLocalValue(value || ''); // Ensure we handle undefined/null
        } else {
          console.log('🎯 TrulyIsolatedEditor: Skipping setValue - same value');
        }
      },
      getValue: () => localValue,
      setChangeCallback: (callback: (value: string) => void) => {
        console.log('🎯 TrulyIsolatedEditor: setChangeCallback called');
        globalChangeCallback = callback;
      }
    };
  }, [localValue]);

  const handleTextChange = useCallback((text: string) => {
    console.log('✏️ TrulyIsolatedEditor: Text changed, new length:', text.length, 'lines:', text.split('\n').length);
    setLocalValue(text);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce callback to parent
    timeoutRef.current = setTimeout(() => {
      if (globalChangeCallback) {
        globalChangeCallback(text);
      }
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Get screen dimensions for responsive sizing
  const { width, height } = Dimensions.get('window');
  const isMobile = width < 768;
  const isVeryNarrow = width < 480;

  // Calculate dynamic height based on content
  const calculateDynamicHeight = () => {
    const content = localValue || '';
    const lines = content.split('\n');
    // For empty content, show placeholder height. For content, ensure minimum of 8 lines visible.
    const contentLineCount = lines.length;
    const minDisplayLines = content.trim() === '' ? 8 : 8; // Show 8 lines minimum always
    const lineCount = Math.max(contentLineCount, minDisplayLines);
    
    const lineHeight = isVeryNarrow ? 20 : (isMobile ? 24 : 22);
    const padding = isVeryNarrow ? 24 : (isMobile ? 32 : 32); // Top + bottom padding
    const calculatedHeight = (lineCount * lineHeight) + padding;
    
    // Set reasonable bounds
    const minHeight = isVeryNarrow ? 180 : (isMobile ? 220 : 250);
    const maxHeight = height * 0.75; // Don't exceed 75% of screen height
    
    const finalHeight = Math.min(Math.max(calculatedHeight, minHeight), maxHeight);
    
    console.log('📏 Dynamic height calc:', {
      contentLength: content.length,
      contentLineCount,
      displayLineCount: lineCount,
      lineHeight,
      calculatedHeight,
      finalHeight,
      isMobile,
      isVeryNarrow,
      isEmpty: content.trim() === ''
    });
    
    return finalHeight;
  };

  const dynamicHeight = calculateDynamicHeight();

  return (
    <TextInput
      ref={textInputRef}
      style={[
        styles.textInput,
        {
          fontSize: isMobile ? 14 : 16,
          lineHeight: isVeryNarrow ? 20 : (isMobile ? 24 : 22),
          minHeight: dynamicHeight,
          height: dynamicHeight, // Set explicit height to match minHeight
        },
      ]}
      value={localValue}
      onChangeText={handleTextChange}
      multiline
      scrollEnabled={true}
      placeholder="Enter your YAML infrastructure definition here..."
      placeholderTextColor="#9ca3af"
      textAlignVertical="top"
      autoFocus={false}
      blurOnSubmit={false}
      autoCorrect={false}
      autoCapitalize="none"
      spellCheck={false}
      keyboardType={Platform.OS === 'ios' ? 'ascii-capable' : 'visible-password'}
      selectTextOnFocus={false}
      returnKeyType="default"
    />
  );
});

export default function YamlEditor({ value, onChange, style, onTogglePane, onMinimizePane, isExpanded, canExpand, templates }: YamlEditorProps) {
  console.log('🔄 YamlEditor: Component render with value length:', value?.length || 0);
  
  const [isEditing, setIsEditing] = useState(Platform.OS !== 'web');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<Record<string, any>>({});
  const [tooltip, setTooltip] = useState<{visible: boolean; message: string; onUndo?: () => void}>({
    visible: false,
    message: '',
  });
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  // Component mount/unmount debugging
  useEffect(() => {
    console.log('🟢 YamlEditor: Component MOUNTED');
    return () => {
      console.log('🔴 YamlEditor: Component UNMOUNTED');
    };
  }, []);

  useEffect(() => {
    const onChange = (result: any) => {
      setScreenData(result.window);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const isMobile = Platform.OS !== 'web' || screenData.width < 768;
  const isVeryNarrow = screenData.width < 600; // Extra narrow screen detection
  
  // Force editing mode on mobile and very narrow screens
  const shouldAlwaysEdit = isMobile || isVeryNarrow;
  
  // Initialize editing state for mobile
  useEffect(() => {
    if (shouldAlwaysEdit) {
      setIsEditing(true);
    }
  }, [shouldAlwaysEdit]);

  // Initialize the isolated editor when component mounts
  useEffect(() => {
    if ((window as any).yamlEditorController) {
      // Set initial value
      (window as any).yamlEditorController.setValue(value || '');
      
      // Set change callback
      (window as any).yamlEditorController.setChangeCallback((newValue: string) => {
        onChange(newValue);
      });
    }
  }, []);

  // Update value from parent when it changes (from templates, etc.)
  // Use a ref to track the last value we set to prevent loops
  const lastParentValueRef = useRef<string>('');
  
  useEffect(() => {
    if ((window as any).yamlEditorController && value !== undefined && value !== lastParentValueRef.current) {
      console.log('📝 YamlEditor: Updating from parent value change:', value?.substring(0, 50) + '...');
      lastParentValueRef.current = value;
      (window as any).yamlEditorController.setValue(value);
    }
  }, [value]);

  // Update available templates when templates prop changes
  useEffect(() => {
    if (templates && Object.keys(templates).length > 0) {
      setAvailableTemplates(templates);
    } else {
      // Fallback templates if none are loaded
      setAvailableTemplates({
        simple: {
          name: 'Simple Web App',
          description: 'A basic web application with client, server, and database',
          yaml: `entities:
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
    type: DB_Connection`
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
  }, [templates]);



  const getCurrentTemplateName = () => {
    if (!value || !value.trim()) return null;
    
    for (const [key, template] of Object.entries(availableTemplates)) {
      if (template.yaml && template.yaml.trim() === value.trim()) {
        return template.name || key;
      }
    }
    return null;
  };

  const currentTemplateName = selectedTemplate || getCurrentTemplateName();

  return (
    <KeyboardAvoidingView 
      style={[
        styles.container, 
        style, 
        isMobile && styles.mobileContainer,
        isVeryNarrow && styles.veryNarrowContainer
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      enabled={isMobile}
    >
              <View style={[
        styles.header, 
        isMobile && styles.mobileHeader,
        isVeryNarrow && styles.veryNarrowHeader
      ]}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>📝 YAML Input</Text>
          <Text style={[
            styles.subtitle, 
            isMobile && styles.mobileSubtitle,
            isVeryNarrow && styles.veryNarrowSubtitle
          ]}>
            {isVeryNarrow ? 'Edit YAML' : (isMobile ? 'Edit your infrastructure YAML' : 'Master configuration - changes here update everything')}
          </Text>
          {currentTemplateName && (
            <View style={styles.templateIndicator}>
              <Text style={styles.templateIndicatorText}>📋 {currentTemplateName}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerControls}>
          {!isMobile && (
            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text style={styles.modeButtonText}>
                {isEditing ? '👁️ View' : '✏️ Edit'}
              </Text>
            </TouchableOpacity>
          )}
          {onMinimizePane && (
            <TouchableOpacity
              style={styles.minimizeButton}
              onPress={onMinimizePane}
            >
              <Text style={styles.minimizeButtonText}>−</Text>
            </TouchableOpacity>
          )}
          {canExpand && onTogglePane && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={onTogglePane}
            >
              <Text style={styles.expandButtonText}>
                {isExpanded ? '⤓' : '⤢'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[
        styles.editorContainer, 
        isMobile && styles.mobileEditorContainer,
        isVeryNarrow && styles.veryNarrowEditorContainer
      ]}>
        {!shouldAlwaysEdit && !isEditing && value && value.trim() ? (
          <ScrollView style={styles.syntaxContainer}>
            <TouchableOpacity
              style={styles.syntaxTouchable}
              onPress={() => setIsEditing(true)}
            >
              <pre style={{
                margin: 0,
                padding: 16,
                fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                fontSize: 14,
                lineHeight: 1.5,
                backgroundColor: '#ffffff',
                color: '#1f2937',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {value || 'Enter your YAML infrastructure definition here...'}
              </pre>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <TrulyIsolatedEditor
            key="yaml-editor-isolated" // Stable key to prevent remounting
          />
        )}
      </View>
      
      {/* Success Tooltip */}
      <SuccessTooltip
        visible={tooltip.visible}
        message={tooltip.message}
        onUndo={tooltip.onUndo}
        onClose={() => setTooltip({ visible: false, message: '' })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    minHeight: 0, // Allow flex shrinking
  },
  mobileContainer: {
    flex: 1,
    height: '100%',
    maxHeight: '100%',
  },
  veryNarrowContainer: {
    flex: 1,
    height: '100%',
    maxHeight: '100%',
    minHeight: '100%', // Force full viewport height on very narrow screens
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ideTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ideTheme.colors.light.border,
  },
  mobileHeader: {
    padding: 12,
    minHeight: 60,
  },
  veryNarrowHeader: {
    padding: 8,
    minHeight: 50, // More compact header for very narrow screens
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: ideTheme.typography.ui.fontSize + 1,
    fontWeight: '600',
    color: ideTheme.colors.light.text,
    fontFamily: ideTheme.fonts.system,
    letterSpacing: ideTheme.typography.ui.letterSpacing,
  },
  subtitle: {
    fontSize: ideTheme.typography.small.fontSize,
    color: '#6b7280',
    marginTop: ideTheme.spacing.xs,
    fontFamily: ideTheme.fonts.system,
    letterSpacing: ideTheme.typography.small.letterSpacing,
  },
  mobileSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  veryNarrowSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  templateIndicator: {
    marginTop: 4,
  },
  templateIndicatorText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  modeButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: ideTheme.spacing.xs,
    paddingHorizontal: ideTheme.spacing.sm,
    borderRadius: ideTheme.borderRadius.sm,
    marginLeft: ideTheme.spacing.sm,
  },
  modeButtonText: {
    color: '#374151',
    fontSize: ideTheme.typography.small.fontSize,
    fontWeight: '500',
    fontFamily: ideTheme.fonts.system,
    letterSpacing: ideTheme.typography.small.letterSpacing,
  },
  minimizeButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  minimizeButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  expandButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  expandButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    minHeight: 0, // Allow flex shrinking
  },
  mobileEditorContainer: {
    flex: 1,
    height: '100%',
  },
  veryNarrowEditorContainer: {
    flex: 1,
    minHeight: 10, // Take up most of the screen on very narrow displays
  },
  textInput: {
    flex: 1,
    padding: ideTheme.spacing.lg,
    fontSize: ideTheme.typography.code.fontSize,
    fontFamily: Platform.OS === 'web' ? ideTheme.fonts.code : (Platform.OS === 'ios' ? 'Menlo' : 'monospace'),
    color: ideTheme.colors.light.text,
    textAlignVertical: 'top',
    backgroundColor: ideTheme.colors.light.background,
    lineHeight: ideTheme.typography.code.lineHeight,
    letterSpacing: ideTheme.typography.code.letterSpacing,
    // Dynamic height calculation is now handled in the component
  },
  mobileTextInput: {
    flex: 1,
    fontSize: 16, // Larger font for mobile
    padding: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  veryNarrowTextInput: {
    fontSize: 14, // Slightly smaller font to fit more content
    padding: 12,
    lineHeight: 20,
  },
  syntaxContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  syntaxTouchable: {
    flex: 1,
    padding: 16,
    minHeight: 200,
  },
}); 
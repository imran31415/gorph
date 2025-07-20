import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
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

export default function YamlEditor({ value, onChange, style, onTogglePane, onMinimizePane, isExpanded, canExpand, templates }: YamlEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<Record<string, any>>({});
  const [tooltip, setTooltip] = useState<{visible: boolean; message: string; onUndo?: () => void}>({
    visible: false,
    message: '',
  });

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
    if (!value.trim()) return null;
    
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
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>📝 YAML Input</Text>
          <Text style={styles.subtitle}>Master configuration - changes here update everything</Text>
          {currentTemplateName && (
            <View style={styles.templateIndicator}>
              <Text style={styles.templateIndicatorText}>📋 {currentTemplateName}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerControls}>
          {Platform.OS === 'web' && (
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

      <View style={styles.editorContainer}>
        {Platform.OS === 'web' && !isEditing && value.trim() ? (
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
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={onChange}
            multiline
            scrollEnabled={true}
            placeholder="Enter your YAML infrastructure definition here..."
            placeholderTextColor="#9ca3af"
            textAlignVertical="top"
            autoFocus={isEditing}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ideTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ideTheme.colors.light.border,
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
    minHeight: 200, // Minimum height for usability
    // Remove maxHeight constraint to allow full expansion
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
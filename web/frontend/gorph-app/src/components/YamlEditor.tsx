import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';
import TemplateModal from './TemplateModal';

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  style?: any;
  onTogglePane?: () => void;
  isExpanded?: boolean;
  canExpand?: boolean;
  onViewDiagram?: () => void;
  templates?: Record<string, any>;
}

// Templates will be loaded from the Go WASM backend
const templates: Record<string, any> = {};

export default function YamlEditor({ value, onChange, style, onTogglePane, isExpanded, canExpand, onViewDiagram, templates }: YamlEditorProps) {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<Record<string, any>>({});

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

  const handleTemplateSelect = (template: any) => {
    onChange(template.yaml);
    setSelectedTemplate(template.name);
    setShowTemplateModal(false);
  };

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
          {currentTemplateName && (
            <View style={styles.templateIndicator}>
              <Text style={styles.templateIndicatorText}>📋 {currentTemplateName}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={styles.templateButton}
            onPress={() => {
              setShowTemplateModal(true);
            }}
          >
            <Text style={styles.templateButtonText}>Templates</Text>
          </TouchableOpacity>
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
          {canExpand && onTogglePane && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={onTogglePane}
            >
              <Text style={styles.expandButtonText}>
                {isExpanded ? '-' : '+'}
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
            contentInsetAdjustmentBehavior="automatic"
            autoFocus={isEditing}
          />
        )}
      </View>
      
      {onViewDiagram && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.viewDiagramButton}
            onPress={onViewDiagram}
          >
            <Text style={styles.viewDiagramButtonText}>📊 View Visual Diagram</Text>
          </TouchableOpacity>
        </View>
      )}

      <TemplateModal
        visible={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={handleTemplateSelect}
        templates={availableTemplates}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
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
  templateButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  templateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  modeButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  modeButtonText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  expandButton: {
    backgroundColor: '#10b981',
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    minHeight: 0, // Allow flex shrinking
  },
  textInput: {
    flex: 1,
    padding: 16,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#1f2937',
    textAlignVertical: 'top',
    backgroundColor: '#ffffff',
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
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  viewDiagramButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDiagramButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
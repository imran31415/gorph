import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView, ScrollView } from 'react-native';

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  style?: any;
  onTogglePane?: () => void;
  isExpanded?: boolean;
  canExpand?: boolean;
  onViewDiagram?: () => void;
}

const templates = {
  simple: {
    name: 'Simple Web App',
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
    type: DB_Connection`
  },
  webapp: {
    name: 'Web Application',
    yaml: `entities:
  - id: User
    category: USER_FACING
    description: "End user accessing the web app"
    status: healthy
    owner: product
    environment: production
    tags: [external]

  - id: WebServer
    category: FRONTEND
    description: "Static web server"
    status: healthy
    owner: frontend-team
    environment: production
    tags: [critical]
    attributes:
      framework: Nginx

  - id: APIServer
    category: BACKEND
    description: "REST API backend"
    status: healthy
    owner: backend-team
    environment: production
    tags: [critical]
    attributes:
      language: Python

  - id: Database
    category: DATABASE
    description: "PostgreSQL database"
    status: healthy
    owner: data-team
    environment: production
    attributes:
      engine: PostgreSQL

connections:
  - from: User
    to: WebServer
    type: HTTP_Request
  - from: WebServer
    to: APIServer
    type: API_Call
  - from: APIServer
    to: Database
    type: DB_Connection`
  },
  microservices: {
    name: 'Microservices',
    yaml: `entities:
  - id: APIGateway
    category: NETWORK
    description: "Entry point for all services"
    status: healthy
    owner: platform-team
    environment: production

  - id: UserService
    category: BACKEND
    description: "User management microservice"
    status: healthy
    owner: user-team
    environment: production
    attributes:
      language: Java

  - id: OrderService
    category: BACKEND
    description: "Order processing service"
    status: degraded
    owner: order-team
    environment: production
    attributes:
      language: Go

  - id: PaymentService
    category: BACKEND
    description: "Payment processing service"
    status: down
    owner: payment-team
    environment: production
    tags: [critical]
    attributes:
      language: Python

  - id: UserDB
    category: DATABASE
    description: "User data PostgreSQL"
    status: healthy
    owner: user-team
    environment: production

  - id: OrderDB
    category: DATABASE
    description: "Order data MongoDB"
    status: healthy
    owner: order-team
    environment: production

connections:
  - from: APIGateway
    to: UserService
    type: Service_Call
  - from: APIGateway
    to: OrderService
    type: Service_Call
  - from: APIGateway
    to: PaymentService
    type: Service_Call
  - from: UserService
    to: UserDB
    type: DB_Connection
  - from: OrderService
    to: OrderDB
    type: DB_Connection`
  }
};

export default function YamlEditor({ value, onChange, style, onTogglePane, isExpanded, canExpand, onViewDiagram }: YamlEditorProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleTemplateSelect = (template: any) => {
    onChange(template.yaml);
    setShowTemplates(false);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>📝 YAML Input</Text>
        </View>
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={styles.templateButton}
            onPress={() => setShowTemplates(!showTemplates)}
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

      {showTemplates && (
        <View style={styles.templateList}>
          {Object.entries(templates).map(([key, template]) => (
            <TouchableOpacity
              key={key}
              style={styles.templateItem}
              onPress={() => handleTemplateSelect(template)}
            >
              <Text style={styles.templateItemText}>{template.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

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
  templateList: {
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  templateItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  templateItemText: {
    color: '#374151',
    fontSize: 14,
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
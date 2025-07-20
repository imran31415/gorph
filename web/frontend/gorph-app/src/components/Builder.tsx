import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DiagramViewer from './DiagramViewer';
import SuccessTooltip from './SuccessTooltip';
import LLMGenerator from './LLMGenerator';
import { ideTheme } from '../theme/ideTheme';

// YAML Schema constants
const CATEGORIES = [
  'USER_FACING',
  'FRONTEND',
  'BACKEND',
  'DATABASE',
  'NETWORK',
  'INTEGRATION',
  'INFRASTRUCTURE',
  'INTERNAL',
  'CI',
  'REGISTRY',
  'CONFIG',
  'CD',
  'ENVIRONMENT',
  'SCM',
];

const STATUS_OPTIONS = ['healthy', 'degraded', 'down', 'unknown'];

const CONNECTION_TYPES = [
  'HTTP_Request',
  'API_Call',
  'Internal_API',
  'DB_Connection',
  'Service_Call',
  'User_Interaction',
  'Triggers_Build',
  'Pushes_Image',
  'Updates_Config',
  'Watches_Config',
  'Deploys_To',
  'Deploys',
  'Hosts',
];

const ENVIRONMENTS = ['production', 'staging', 'development'];

interface Entity {
  id: string;
  category: string;
  description: string;
  status: string;
  owner: string;
  environment: string;
  attributes?: Record<string, string>;
  tags?: string[];
}

interface Connection {
  from: string;
  to: string;
  type: string;
}

interface BuilderProps {
  yamlContent: string;
  onYamlChange: (yaml: string) => void;
  svgOutput?: string;
  dotOutput?: string;
  onTogglePane?: () => void;
  onMinimizePane?: () => void;
  isExpanded?: boolean;
  canExpand?: boolean;
  templates?: Record<string, any>;
  onTemplatePress?: () => void;
}

export default function Builder({ yamlContent, onYamlChange, svgOutput, dotOutput, onTogglePane, onMinimizePane, isExpanded, canExpand, templates, onTemplatePress }: BuilderProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [showAddForm, setShowAddForm] = useState<'entity' | 'connection' | null>(null);
  const [editingItem, setEditingItem] = useState<{type: 'entity' | 'connection', index: number} | null>(null);
  const [tooltip, setTooltip] = useState<{visible: boolean; message: string; onUndo?: () => void}>({
    visible: false,
    message: '',
  });
  const [activeTab, setActiveTab] = useState<'entities' | 'connections'>('entities'); // Tab state
  const [showLLMGenerator, setShowLLMGenerator] = useState(false);
  
  // Debug: Log when Builder component mounts and props change
  useEffect(() => {
    console.log('Builder: Component mounted with yamlContent length:', yamlContent?.length || 0);
  }, []);

  // Load saved diagram height from storage
  const loadDiagramHeight = async () => {
    try {
      const savedHeight = await AsyncStorage.getItem('diagram-height');
      if (savedHeight) {
        // setDiagramHeight(parseInt(savedHeight, 10)); // Removed as diagram is removed
      }
    } catch (error) {
      console.log('Failed to load diagram height:', error);
    }
  };

  // Save diagram height to storage
  const saveDiagramHeight = async (height: number) => {
    try {
      await AsyncStorage.setItem('diagram-height', height.toString());
    } catch (error) {
      console.log('Failed to save diagram height:', error);
    }
  };

  // Helper function to show success tooltip
  const showSuccessTooltip = (message: string, undoAction?: () => void) => {
    setTooltip({
      visible: true,
      message,
      onUndo: undoAction,
    });
  };


  
  // Entity form state
  const [entityForm, setEntityForm] = useState({
    id: '',
    category: 'FRONTEND',
    description: '',
    status: 'healthy',
    owner: '',
    environment: 'production',
    attributes: '',
    tags: '',
  });

  // Connection form state
  const [connectionForm, setConnectionForm] = useState({
    from: '',
    to: '',
    type: 'HTTP_Request',
  });

  // Parse existing YAML when it changes (but not from our own updates)
  const [lastGeneratedYaml, setLastGeneratedYaml] = useState('');
  const isUpdatingFromBuilderRef = useRef(false);
  
  useEffect(() => {
    if (yamlContent && yamlContent !== lastGeneratedYaml) {
      try {
        console.log('Builder: Parsing YAML content:', yamlContent.substring(0, 100) + '...');
        const parsed = parseYaml(yamlContent);
        console.log('Builder: Parsed entities:', parsed.entities.length, 'connections:', parsed.connections.length);
        
        // Only update if we actually parsed something useful
        if (parsed.entities.length > 0 || parsed.connections.length > 0) {
          setEntities(parsed.entities || []);
          setConnections(parsed.connections || []);
          console.log('Builder: Updated entities and connections from YAML');
        }
      } catch (error) {
        console.log('Builder: Could not parse existing YAML:', error);
      }
    }
  }, [yamlContent, lastGeneratedYaml]);

  // Generate YAML whenever entities or connections change (with cycle detection)
  useEffect(() => {
    const yaml = generateYaml(entities, connections);
    console.log('Builder: Generated YAML from', entities.length, 'entities and', connections.length, 'connections');
    
    // Only update if the YAML has actually changed
    if (yaml !== lastGeneratedYaml && yaml !== yamlContent) {
      console.log('Builder: Updating YAML content');
      setLastGeneratedYaml(yaml);
      onYamlChange(yaml);
    } else {
      console.log('Builder: Skipping YAML update (no change)');
    }
  }, [entities, connections, onYamlChange, lastGeneratedYaml, yamlContent]);

  // Handle LLM-generated YAML
  const handleLLMYamlGenerated = (generatedYaml: string) => {
    console.log('Builder: Received LLM-generated YAML');
    try {
      const parsed = parseYaml(generatedYaml);
      setEntities(parsed.entities || []);
      setConnections(parsed.connections || []);
      
      // Update the YAML content directly
      setLastGeneratedYaml(generatedYaml);
      onYamlChange(generatedYaml);
      
      showSuccessTooltip('AI-generated infrastructure diagram loaded successfully! 🤖✨');
      setShowLLMGenerator(false);
    } catch (error) {
      console.error('Failed to parse LLM-generated YAML:', error);
      Alert.alert('Error', 'Failed to parse the AI-generated YAML. Please try again or refine your description.');
    }
  };

  const parseYaml = (yaml: string) => {
    // Enhanced YAML parser for better structure handling
    const lines = yaml.split('\n');
    const result: { entities: Entity[]; connections: Connection[] } = {
      entities: [],
      connections: [],
    };

    let currentSection = '';
    let currentEntity: Partial<Entity> = {};
    let currentConnection: Partial<Connection> = {};
    let inAttributes = false;
    let inTags = false;
    let attributes: Record<string, string> = {};
    let tags: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      if (trimmed === 'entities:') {
        currentSection = 'entities';
        inAttributes = false;
        inTags = false;
        continue;
      } else if (trimmed === 'connections:') {
        // Save any pending entity
        if (currentSection === 'entities' && Object.keys(currentEntity).length > 0) {
          if (Object.keys(attributes).length > 0) {
            currentEntity.attributes = { ...attributes };
          }
          if (tags.length > 0) {
            currentEntity.tags = [...tags];
          }
          result.entities.push(currentEntity as Entity);
        }
        currentSection = 'connections';
        currentEntity = {};
        attributes = {};
        tags = [];
        inAttributes = false;
        inTags = false;
        continue;
      }

      if (currentSection === 'entities') {
        if (trimmed.startsWith('- id:')) {
          // Save previous entity
          if (Object.keys(currentEntity).length > 0) {
            if (Object.keys(attributes).length > 0) {
              currentEntity.attributes = { ...attributes };
            }
            if (tags.length > 0) {
              currentEntity.tags = [...tags];
            }
            result.entities.push(currentEntity as Entity);
          }
          // Start new entity
          const id = trimmed.split(':')[1].split('#')[0].trim().replace(/"/g, '');
          currentEntity = { id };
          attributes = {};
          tags = [];
          inAttributes = false;
          inTags = false;
        } else if (trimmed === 'attributes:') {
          inAttributes = true;
          inTags = false;
        } else if (trimmed.startsWith('tags:')) {
          inTags = true;
          inAttributes = false;
          // Parse inline tags: tags: ["tag1", "tag2"]
          const tagMatch = trimmed.match(/tags:\s*\[(.*)\]/);
          if (tagMatch) {
            tags = tagMatch[1].split(',').map(tag => tag.trim().replace(/"/g, ''));
          }
        } else if (inAttributes && trimmed.includes(':')) {
          const [key, ...valueParts] = trimmed.split(':');
          const value = valueParts.join(':').trim().replace(/"/g, '');
          if (key && value) {
            attributes[key.trim()] = value;
          }
        } else if (trimmed.startsWith('category:')) {
          const value = trimmed.split(':')[1].split('#')[0].trim().replace(/"/g, '');
          currentEntity.category = value;
          inAttributes = false;
          inTags = false;
        } else if (trimmed.startsWith('description:')) {
          const value = trimmed.split(':')[1].split('#')[0].trim().replace(/"/g, '');
          currentEntity.description = value;
          inAttributes = false;
          inTags = false;
        } else if (trimmed.startsWith('status:')) {
          const value = trimmed.split(':')[1].split('#')[0].trim().replace(/"/g, '');
          currentEntity.status = value;
          inAttributes = false;
          inTags = false;
        } else if (trimmed.startsWith('owner:')) {
          const value = trimmed.split(':')[1].split('#')[0].trim().replace(/"/g, '');
          currentEntity.owner = value;
          inAttributes = false;
          inTags = false;
        } else if (trimmed.startsWith('environment:')) {
          const value = trimmed.split(':')[1].split('#')[0].trim().replace(/"/g, '');
          currentEntity.environment = value;
          inAttributes = false;
          inTags = false;
        }
      } else if (currentSection === 'connections') {
        if (trimmed.startsWith('- from:')) {
          // Save previous connection
          if (Object.keys(currentConnection).length > 0) {
            result.connections.push(currentConnection as Connection);
          }
          // Start new connection
          currentConnection = { from: trimmed.split(':')[1].trim().replace(/"/g, '') };
        } else if (trimmed.startsWith('from:')) {
          currentConnection.from = trimmed.split(':')[1].trim().replace(/"/g, '');
        } else if (trimmed.startsWith('to:')) {
          currentConnection.to = trimmed.split(':')[1].trim().replace(/"/g, '');
        } else if (trimmed.startsWith('type:')) {
          currentConnection.type = trimmed.split(':')[1].trim().replace(/"/g, '');
        }
      }
    }

    // Add the last entity/connection
    if (currentSection === 'entities' && Object.keys(currentEntity).length > 0) {
      if (Object.keys(attributes).length > 0) {
        currentEntity.attributes = { ...attributes };
      }
      if (tags.length > 0) {
        currentEntity.tags = [...tags];
      }
      result.entities.push(currentEntity as Entity);
    }
    if (currentSection === 'connections' && Object.keys(currentConnection).length > 0) {
      result.connections.push(currentConnection as Connection);
    }

    return result;
  };

  const generateYaml = (entities: Entity[], connections: Connection[]): string => {
    // Don't generate YAML if we have no entities
    if (entities.length === 0 && connections.length === 0) {
      return '';
    }
    
    let yaml = 'entities:\n';
    
    if (entities.length === 0) {
      yaml += '  # No entities defined yet\n';
    } else {
      entities.forEach(entity => {
        yaml += `  - id: ${entity.id}\n`;
        yaml += `    category: ${entity.category}\n`;
        yaml += `    description: "${entity.description}"\n`;
        yaml += `    status: ${entity.status}\n`;
        yaml += `    owner: ${entity.owner}\n`;
        yaml += `    environment: ${entity.environment}\n`;
        
        if (entity.attributes && Object.keys(entity.attributes).length > 0) {
          yaml += `    attributes:\n`;
          Object.entries(entity.attributes).forEach(([key, value]) => {
            yaml += `      ${key}: "${value}"\n`;
          });
        }
        
        if (entity.tags && entity.tags.length > 0) {
          yaml += `    tags: [${entity.tags.map(tag => `"${tag}"`).join(', ')}]\n`;
        }
        
        yaml += '\n';
      });
    }

    yaml += '\nconnections:\n';
    if (connections.length === 0) {
      yaml += '  # No connections defined yet\n';
    } else {
      connections.forEach(connection => {
        yaml += `  - from: ${connection.from}\n`;
        yaml += `    to: ${connection.to}\n`;
        yaml += `    type: ${connection.type}\n`;
      });
    }

    return yaml;
  };

  const addEntity = () => {
    // Enhanced validation with better error messages
    if (!entityForm.id.trim()) {
      Alert.alert('Validation Error', 'Entity ID is required', [{ text: 'OK' }]);
      return;
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(entityForm.id.trim())) {
      Alert.alert(
        'Validation Error', 
        'Entity ID must start with a letter and contain only letters, numbers, underscores, and dashes. Dashes will be automatically converted to underscores for GraphViz compatibility.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (entities.some(e => e.id === entityForm.id.trim())) {
      Alert.alert(
        'Validation Error', 
        `An entity with ID "${entityForm.id.trim()}" already exists. Please choose a unique ID.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (!entityForm.description.trim()) {
      Alert.alert('Validation Error', 'Description is required', [{ text: 'OK' }]);
      return;
    }

    if (!entityForm.owner.trim()) {
      Alert.alert('Validation Error', 'Owner is required', [{ text: 'OK' }]);
      return;
    }

    const newEntity: Entity = {
      id: entityForm.id.trim(),
      category: entityForm.category,
      description: entityForm.description.trim(),
      status: entityForm.status,
      owner: entityForm.owner.trim(),
      environment: entityForm.environment,
    };

    // Parse attributes if provided
    if (entityForm.attributes.trim()) {
      try {
        const attributes: Record<string, string> = {};
        entityForm.attributes.split('\n').forEach(line => {
          const [key, value] = line.split(':').map(s => s.trim());
          if (key && value) {
            attributes[key] = value;
          }
        });
        if (Object.keys(attributes).length > 0) {
          newEntity.attributes = attributes;
        }
      } catch (error) {
        console.log('Could not parse attributes');
      }
    }

    // Parse tags if provided
    if (entityForm.tags.trim()) {
      const parsedTags = entityForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      if (parsedTags.length > 0) {
        newEntity.tags = parsedTags;
      }
    }

    const previousEntities = [...entities];
    setEntities([...entities, newEntity]);
    
    // Show success tooltip with undo
    showSuccessTooltip(
      `Entity "${newEntity.id}" added successfully!`,
      () => setEntities(previousEntities)
    );
    
    // Reset form and close modal
    setEntityForm({
      id: '',
      category: 'FRONTEND',
      description: '',
      status: 'healthy',
      owner: '',
      environment: 'production',
      attributes: '',
      tags: '',
    });
    setShowAddForm(null);
  };

  const addConnection = () => {
    // Enhanced validation with better error messages
    if (!connectionForm.from || !connectionForm.to) {
      Alert.alert(
        'Validation Error', 
        'Both source and target entities are required for a connection',
        [{ text: 'OK' }]
      );
      return;
    }

    if (connectionForm.from === connectionForm.to) {
      Alert.alert(
        'Validation Error', 
        'Source and target entities cannot be the same. Please select different entities.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!entities.some(e => e.id === connectionForm.from)) {
      Alert.alert(
        'Validation Error', 
        `Source entity "${connectionForm.from}" does not exist`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (!entities.some(e => e.id === connectionForm.to)) {
      Alert.alert(
        'Validation Error', 
        `Target entity "${connectionForm.to}" does not exist`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Check for duplicate connections
    const duplicateConnection = connections.find(
      c => c.from === connectionForm.from && c.to === connectionForm.to && c.type === connectionForm.type
    );
    
    if (duplicateConnection) {
      Alert.alert(
        'Validation Error', 
        `A connection of type "${connectionForm.type}" already exists between "${connectionForm.from}" and "${connectionForm.to}"`,
        [{ text: 'OK' }]
      );
      return;
    }

    const newConnection: Connection = {
      from: connectionForm.from,
      to: connectionForm.to,
      type: connectionForm.type,
    };

    const previousConnections = [...connections];
    setConnections([...connections, newConnection]);
    
    // Show success tooltip with undo
    showSuccessTooltip(
      `Connection from "${newConnection.from}" to "${newConnection.to}" added successfully!`,
      () => setConnections(previousConnections)
    );
    
    // Reset form and close modal
    setConnectionForm({
      from: '',
      to: '',
      type: 'HTTP_Request',
    });
    setShowAddForm(null);
  };

  const deleteEntity = (id: string) => {
    setEntities(entities.filter(e => e.id !== id));
    setConnections(connections.filter(c => c.from !== id && c.to !== id));
  };

  const deleteConnection = (index: number) => {
    setConnections(connections.filter((_, i) => i !== index));
  };



  return (
    <View style={styles.container}>
      {/* Builder Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>🎛️ Infrastructure Builder</Text>
        </View>
        <View style={styles.headerControls}>
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
      
      <ScrollView style={styles.scrollContainer}>
        {/* Control Panel */}
        <View style={styles.controlPanel}>
          <Text style={styles.controlPanelTitle}>Infrastructure Components</Text>
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={[
                styles.controlButton, 
                styles.addEntityButton,
                activeTab === 'entities' && styles.controlButtonActive
              ]}
              onPress={() => {
                setActiveTab('entities');
                setShowAddForm('entity');
              }}
            >
              <Text style={styles.controlButtonIcon}>🏗️</Text>
              <Text style={styles.controlButtonText}>Add Entity</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton, 
                styles.addConnectionButton,
                activeTab === 'connections' && styles.controlButtonActive,
                entities.length < 2 && styles.controlButtonDisabled
              ]}
              onPress={() => {
                if (entities.length >= 2) {
                  setActiveTab('connections');
                  setShowAddForm('connection');
                }
              }}
              disabled={entities.length < 2}
            >
              <Text style={styles.controlButtonIcon}>🔗</Text>
              <Text style={[
                styles.controlButtonText,
                entities.length < 2 && styles.controlButtonTextDisabled
              ]}>
                Add Connection
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.templateButton]}
              onPress={() => {
                // This will be handled by the parent component
                if (onTemplatePress) {
                  onTemplatePress();
                }
              }}
            >
              <Text style={styles.controlButtonIcon}>📋</Text>
              <Text style={styles.controlButtonText}>Create From Template</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.aiCreateButton]}
              onPress={() => setShowLLMGenerator(true)}
            >
              <Text style={styles.controlButtonIcon}>🤖</Text>
              <Text style={styles.controlButtonText}>Create with AI</Text>
            </TouchableOpacity>
          </View>
          {entities.length < 2 && (
            <Text style={styles.controlPanelHint}>
              💡 You need at least 2 entities to create connections
            </Text>
          )}
        </View>

        {/* Add Form Modal */}
        {showAddForm && (
          <View style={[
            styles.modalOverlay,
            Platform.OS === 'web' && { justifyContent: 'center', paddingTop: 0 }
          ]}>
            <View style={[
              styles.modalContent,
              Platform.OS === 'web' && {
                borderRadius: 12,
                margin: 20,
                maxHeight: '85%',
                width: '90%',
                marginTop: 0,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
              }
            ]}>
              {showAddForm === 'entity' ? (
                <EntityForm
                  entityForm={entityForm}
                  setEntityForm={setEntityForm}
                  onSave={addEntity}
                  onCancel={() => setShowAddForm(null)}
                />
              ) : (
                <ConnectionForm
                  connectionForm={connectionForm}
                  setConnectionForm={setConnectionForm}
                  entities={entities}
                  onSave={addConnection}
                  onCancel={() => setShowAddForm(null)}
                />
              )}
            </View>
          </View>
        )}

        {/* Tabbed Items List */}
        <View style={styles.itemsList}>
          {/* Tab Headers */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'entities' && styles.activeTab
              ]}
              onPress={() => setActiveTab('entities')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'entities' && styles.activeTabText
              ]}>
                🏗️ Entities ({entities.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'connections' && styles.activeTab
              ]}
              onPress={() => setActiveTab('connections')}
            >
              <Text style={[
                styles.tabText,
                activeTab === 'connections' && styles.activeTabText
              ]}>
                🔗 Connections ({connections.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'entities' && (
              <View style={styles.tabPane}>
                {entities.length > 0 ? (
                  <>
                    <View style={styles.tabHeader}>
                      <Text style={styles.tabHeaderText}>
                        Manage your infrastructure entities
                      </Text>
                      <TouchableOpacity
                        style={styles.quickAddButton}
                        onPress={() => setShowAddForm('entity')}
                      >
                        <Text style={styles.quickAddButtonText}>+ Add Entity</Text>
                      </TouchableOpacity>
                    </View>
                    {entities.map((entity, index) => (
                      <EntityCard
                        key={entity.id}
                        entity={entity}
                        index={index}
                        onEdit={() => setEditingItem({type: 'entity', index})}
                        onDelete={() => deleteEntity(entity.id)}
                        isEditing={editingItem?.type === 'entity' && editingItem.index === index}
                        onSaveEdit={(updatedEntity: Entity) => {
                          const newEntities = [...entities];
                          newEntities[index] = updatedEntity;
                          setEntities(newEntities);
                          setEditingItem(null);
                        }}
                        onCancelEdit={() => setEditingItem(null)}
                      />
                    ))}
                  </>
                ) : (
                  <View style={styles.emptyTabState}>
                    <Text style={styles.emptyTabIcon}>🏗️</Text>
                    <Text style={styles.emptyTabTitle}>No Entities Yet</Text>
                    <Text style={styles.emptyTabText}>
                      Entities represent the components in your infrastructure like servers, databases, APIs, etc.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyTabButton}
                      onPress={() => setShowAddForm('entity')}
                    >
                      <Text style={styles.emptyTabButtonText}>Create Your First Entity</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'connections' && (
              <View style={styles.tabPane}>
                {connections.length > 0 ? (
                  <>
                    <View style={styles.tabHeader}>
                      <Text style={styles.tabHeaderText}>
                        Manage connections between entities
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.quickAddButton,
                          entities.length < 2 && styles.quickAddButtonDisabled
                        ]}
                        onPress={() => setShowAddForm('connection')}
                        disabled={entities.length < 2}
                      >
                        <Text style={[
                          styles.quickAddButtonText,
                          entities.length < 2 && styles.quickAddButtonTextDisabled
                        ]}>
                          + Add Connection
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {connections.map((connection, index) => (
                      <ConnectionCard
                        key={index}
                        connection={connection}
                        index={index}
                        entities={entities}
                        onEdit={() => setEditingItem({type: 'connection', index})}
                        onDelete={() => deleteConnection(index)}
                        isEditing={editingItem?.type === 'connection' && editingItem.index === index}
                        onSaveEdit={(updatedConnection: Connection) => {
                          const newConnections = [...connections];
                          newConnections[index] = updatedConnection;
                          setConnections(newConnections);
                          setEditingItem(null);
                        }}
                        onCancelEdit={() => setEditingItem(null)}
                      />
                    ))}
                  </>
                ) : (
                  <View style={styles.emptyTabState}>
                    <Text style={styles.emptyTabIcon}>🔗</Text>
                    <Text style={styles.emptyTabTitle}>
                      {entities.length < 2 ? 'Need More Entities' : 'No Connections Yet'}
                    </Text>
                    <Text style={styles.emptyTabText}>
                      {entities.length < 2 
                        ? 'You need at least 2 entities before you can create connections between them.'
                        : 'Connections show how your entities interact with each other, like API calls, database queries, etc.'
                      }
                    </Text>
                    {entities.length >= 2 ? (
                      <TouchableOpacity
                        style={styles.emptyTabButton}
                        onPress={() => setShowAddForm('connection')}
                      >
                        <Text style={styles.emptyTabButtonText}>Create Your First Connection</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.emptyTabButton}
                        onPress={() => {
                          setActiveTab('entities');
                          setShowAddForm('entity');
                        }}
                      >
                        <Text style={styles.emptyTabButtonText}>Add More Entities</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Global Empty State - only shown when both tabs are empty */}
          {entities.length === 0 && connections.length === 0 && (
            <View style={styles.globalEmptyState}>
              <Text style={styles.emptyStateIcon}>🎛️</Text>
              <Text style={styles.emptyStateTitle}>Ready to Build!</Text>
              <Text style={styles.emptyStateText}>
                Start creating your infrastructure diagram by adding entities and connections, or load a template from the header
              </Text>
              <Text style={styles.emptyStateText}>
                💡 Use the Templates button in the header to get started with pre-built examples!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Success Tooltip */}
      <SuccessTooltip
        visible={tooltip.visible}
        message={tooltip.message}
        onUndo={tooltip.onUndo}
        onClose={() => setTooltip({ visible: false, message: '' })}
      />

      {/* LLM Generator Modal */}
      <LLMGenerator
        visible={showLLMGenerator}
        onYamlGenerated={handleLLMYamlGenerated}
        onClose={() => setShowLLMGenerator(false)}
      />
    </View>
  );
}

// Entity Form Component
const EntityForm = ({ entityForm, setEntityForm, onSave, onCancel }: any) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!entityForm.id.trim()) {
      newErrors.id = 'Entity ID is required';
    } else if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(entityForm.id.trim())) {
      newErrors.id = 'ID must start with a letter and contain only letters, numbers, underscores, and dashes. Dashes will be automatically converted to underscores for GraphViz compatibility.';
    }
    
    if (!entityForm.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!entityForm.owner.trim()) {
      newErrors.owner = 'Owner is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave();
    }
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        {Platform.OS !== 'web' && <View style={styles.modalHandle} />}
        <Text style={styles.formTitle}>Add New Entity</Text>
        <Text style={styles.formSubtitle}>Fields marked with * are required</Text>
      </View>
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.formScrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, styles.required]}>Entity ID *</Text>
          <TextInput
            style={[
              styles.input,
              errors.id && styles.inputError,
              !entityForm.id && styles.inputRequired
            ]}
            value={entityForm.id}
            onChangeText={(text) => {
              setEntityForm({ ...entityForm, id: text });
              if (errors.id) {
                setErrors({ ...errors, id: '' });
              }
            }}
            placeholder="Enter unique identifier (e.g., WebServer)"
            placeholderTextColor="#9ca3af"
            onBlur={validateForm}
          />
          {errors.id && <Text style={styles.errorText}>{errors.id}</Text>}
          <Text style={styles.helpText}>A unique identifier for this component</Text>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.pickerContainer}>
            {CATEGORIES.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.pickerOption,
                  entityForm.category === category && styles.pickerOptionSelected
                ]}
                onPress={() => setEntityForm({ ...entityForm, category })}
              >
                <Text style={[
                  styles.pickerOptionText,
                  entityForm.category === category && styles.pickerOptionTextSelected
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={[styles.label, styles.required]}>Description *</Text>
          <TextInput
            style={[
              styles.input,
              errors.description && styles.inputError,
              !entityForm.description && styles.inputRequired
            ]}
            value={entityForm.description}
            onChangeText={(text) => {
              setEntityForm({ ...entityForm, description: text });
              if (errors.description) {
                setErrors({ ...errors, description: '' });
              }
            }}
            placeholder="Describe what this component does"
            placeholderTextColor="#9ca3af"
            onBlur={validateForm}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          <Text style={styles.helpText}>Brief explanation of this component's purpose</Text>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.pickerContainer}>
            {STATUS_OPTIONS.map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.pickerOption,
                  entityForm.status === status && styles.pickerOptionSelected
                ]}
                onPress={() => setEntityForm({ ...entityForm, status })}
              >
                <Text style={[
                  styles.pickerOptionText,
                  entityForm.status === status && styles.pickerOptionTextSelected
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={[styles.label, styles.required]}>Owner *</Text>
          <TextInput
            style={[
              styles.input,
              errors.owner && styles.inputError,
              !entityForm.owner && styles.inputRequired
            ]}
            value={entityForm.owner}
            onChangeText={(text) => {
              setEntityForm({ ...entityForm, owner: text });
              if (errors.owner) {
                setErrors({ ...errors, owner: '' });
              }
            }}
            placeholder="Enter team or person responsible"
            placeholderTextColor="#9ca3af"
            onBlur={validateForm}
          />
          {errors.owner && <Text style={styles.errorText}>{errors.owner}</Text>}
          <Text style={styles.helpText}>Team or individual responsible for this component</Text>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Environment</Text>
          <View style={styles.pickerContainer}>
            {ENVIRONMENTS.map(env => (
              <TouchableOpacity
                key={env}
                style={[
                  styles.pickerOption,
                  entityForm.environment === env && styles.pickerOptionSelected
                ]}
                onPress={() => setEntityForm({ ...entityForm, environment: env })}
              >
                <Text style={[
                  styles.pickerOptionText,
                  entityForm.environment === env && styles.pickerOptionTextSelected
                ]}>
                  {env}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Attributes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={entityForm.attributes}
            onChangeText={(text) => setEntityForm({ ...entityForm, attributes: text })}
            placeholder="Add custom attributes&#10;Example:&#10;language: Go&#10;version: 1.0&#10;port: 8080"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
          />
          <Text style={styles.helpText}>Additional properties as key: value pairs, one per line</Text>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Tags (Optional)</Text>
          <TextInput
            style={styles.input}
            value={entityForm.tags}
            onChangeText={(text) => setEntityForm({ ...entityForm, tags: text })}
            placeholder="Add tags separated by commas (e.g., critical, api, public)"
            placeholderTextColor="#9ca3af"
          />
          <Text style={styles.helpText}>Comma-separated tags for categorization</Text>
        </View>
      </ScrollView>

      <View style={styles.formButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Add Entity</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Connection Form Component
const ConnectionForm = ({ connectionForm, setConnectionForm, entities, onSave, onCancel }: any) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!connectionForm.from) {
      newErrors.from = 'Source entity is required';
    }
    
    if (!connectionForm.to) {
      newErrors.to = 'Target entity is required';
    }
    
    if (connectionForm.from === connectionForm.to) {
      newErrors.to = 'Source and target entities cannot be the same';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave();
    }
  };

  // Check if no entities are available
  if (entities.length === 0) {
    return (
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          {Platform.OS !== 'web' && <View style={styles.modalHandle} />}
          <Text style={styles.formTitle}>Add New Connection</Text>
        </View>
        
        <View style={styles.formScrollContent}>
          <View style={styles.emptyEntityState}>
            <Text style={styles.emptyEntityIcon}>🚫</Text>
            <Text style={styles.emptyEntityTitle}>No Entities Available</Text>
            <Text style={styles.emptyEntityText}>
              You need to create at least 2 entities before you can add connections between them.
            </Text>
          </View>
        </View>

        <View style={styles.formButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        {Platform.OS !== 'web' && <View style={styles.modalHandle} />}
        <Text style={styles.formTitle}>Add New Connection</Text>
        <Text style={styles.formSubtitle}>Connect two entities to show their relationship</Text>
      </View>
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={styles.formScrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, styles.required]}>From Entity *</Text>
          {!connectionForm.from && (
            <Text style={styles.helperMessage}>Select the source entity for this connection</Text>
          )}
          <View style={[
            styles.pickerContainer,
            errors.from && styles.pickerError
          ]}>
            {entities.map((entity: Entity) => (
              <TouchableOpacity
                key={entity.id}
                style={[
                  styles.pickerOption,
                  connectionForm.from === entity.id && styles.pickerOptionSelected
                ]}
                onPress={() => {
                  setConnectionForm({ ...connectionForm, from: entity.id });
                  if (errors.from) {
                    setErrors({ ...errors, from: '' });
                  }
                }}
              >
                <Text style={[
                  styles.pickerOptionText,
                  connectionForm.from === entity.id && styles.pickerOptionTextSelected
                ]}>
                  {entity.id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.from && <Text style={styles.errorText}>{errors.from}</Text>}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={[styles.label, styles.required]}>To Entity *</Text>
          {!connectionForm.to && (
            <Text style={styles.helperMessage}>Select the target entity for this connection</Text>
          )}
          <View style={[
            styles.pickerContainer,
            errors.to && styles.pickerError
          ]}>
            {entities.map((entity: Entity) => (
              <TouchableOpacity
                key={entity.id}
                style={[
                  styles.pickerOption,
                  connectionForm.to === entity.id && styles.pickerOptionSelected,
                  connectionForm.from === entity.id && styles.pickerOptionDisabled
                ]}
                onPress={() => {
                  if (connectionForm.from !== entity.id) {
                    setConnectionForm({ ...connectionForm, to: entity.id });
                    if (errors.to) {
                      setErrors({ ...errors, to: '' });
                    }
                  }
                }}
                disabled={connectionForm.from === entity.id}
              >
                <Text style={[
                  styles.pickerOptionText,
                  connectionForm.to === entity.id && styles.pickerOptionTextSelected,
                  connectionForm.from === entity.id && styles.pickerOptionTextDisabled
                ]}>
                  {entity.id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.to && <Text style={styles.errorText}>{errors.to}</Text>}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Connection Type</Text>
          <Text style={styles.helpText}>Describes how these entities interact</Text>
          <View style={styles.pickerContainer}>
            {CONNECTION_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.pickerOption,
                  connectionForm.type === type && styles.pickerOptionSelected
                ]}
                onPress={() => setConnectionForm({ ...connectionForm, type })}
              >
                <Text style={[
                  styles.pickerOptionText,
                  connectionForm.type === type && styles.pickerOptionTextSelected
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Connection Preview */}
        {connectionForm.from && connectionForm.to && (
          <View style={styles.connectionPreview}>
            <Text style={styles.previewLabel}>Connection Preview:</Text>
            <View style={styles.previewConnection}>
              <Text style={styles.previewEntity}>{connectionForm.from}</Text>
              <Text style={styles.previewArrow}>→</Text>
              <Text style={styles.previewEntity}>{connectionForm.to}</Text>
            </View>
            <Text style={styles.previewType}>{connectionForm.type}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.formButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!connectionForm.from || !connectionForm.to) && styles.saveButtonDisabled
          ]} 
          onPress={handleSave}
          disabled={!connectionForm.from || !connectionForm.to}
        >
          <Text style={[
            styles.saveButtonText,
            (!connectionForm.from || !connectionForm.to) && styles.saveButtonTextDisabled
          ]}>
            Add Connection
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Entity Card Component
const EntityCard = ({ entity, index, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit }: any) => {
  const [editForm, setEditForm] = useState(entity);

  const handleSave = () => {
    onSaveEdit(editForm);
  };

  if (isEditing) {
    return (
      <View style={styles.editCard}>
        <Text style={styles.editCardTitle}>Edit Entity</Text>
        
        <Text style={styles.label}>ID *</Text>
        <TextInput
          style={styles.input}
          value={editForm.id}
          onChangeText={(text) => setEditForm({ ...editForm, id: text })}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={editForm.description}
          onChangeText={(text) => setEditForm({ ...editForm, description: text })}
        />

        <View style={styles.formButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancelEdit}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>🏗️ {entity.id}</Text>
          <Text style={styles.itemSubtitle}>{entity.description}</Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.itemMeta}>
        <Text style={styles.itemMetaText}>{entity.category}</Text>
        <Text style={styles.itemMetaText}>{entity.status}</Text>
        <Text style={styles.itemMetaText}>{entity.owner}</Text>
      </View>
    </View>
  );
};

// Connection Card Component
const ConnectionCard = ({ connection, index, entities, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit }: any) => {
  const [editForm, setEditForm] = useState(connection);

  const handleSave = () => {
    onSaveEdit(editForm);
  };

  if (isEditing) {
    return (
      <View style={styles.editCard}>
        <Text style={styles.editCardTitle}>Edit Connection</Text>
        
        <Text style={styles.label}>From Entity *</Text>
        <View style={styles.pickerContainer}>
          {entities.map((entity: Entity) => (
            <TouchableOpacity
              key={entity.id}
              style={[
                styles.pickerOption,
                editForm.from === entity.id && styles.pickerOptionSelected
              ]}
              onPress={() => setEditForm({ ...editForm, from: entity.id })}
            >
              <Text style={[
                styles.pickerOptionText,
                editForm.from === entity.id && styles.pickerOptionTextSelected
              ]}>
                {entity.id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>To Entity *</Text>
        <View style={styles.pickerContainer}>
          {entities.map((entity: Entity) => (
            <TouchableOpacity
              key={entity.id}
              style={[
                styles.pickerOption,
                editForm.to === entity.id && styles.pickerOptionSelected
              ]}
              onPress={() => setEditForm({ ...editForm, to: entity.id })}
            >
              <Text style={[
                styles.pickerOptionText,
                editForm.to === entity.id && styles.pickerOptionTextSelected
              ]}>
                {entity.id}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Connection Type</Text>
        <View style={styles.pickerContainer}>
          {CONNECTION_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.pickerOption,
                editForm.type === type && styles.pickerOptionSelected
              ]}
              onPress={() => setEditForm({ ...editForm, type })}
            >
              <Text style={[
                styles.pickerOptionText,
                editForm.type === type && styles.pickerOptionTextSelected
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.formButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancelEdit}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>🔗 {connection.from} → {connection.to}</Text>
          <Text style={styles.itemSubtitle}>{connection.type}</Text>
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity style={styles.editButton} onPress={onEdit}>
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: ideTheme.typography.ui.fontSize + 3,
    fontWeight: '600',
    color: ideTheme.colors.light.text,
    fontFamily: ideTheme.fonts.system,
    letterSpacing: ideTheme.typography.ui.letterSpacing,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  scrollContainer: {
    flex: 1,
  },
  controlPanel: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  controlPanelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  controlButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  addEntityButton: {
    backgroundColor: '#10b981',
  },
  addConnectionButton: {
    backgroundColor: '#3b82f6',
  },
  controlButtonIcon: {
    fontSize: 16,
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  controlButtonTextDisabled: {
    color: '#9ca3af',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1000,
    paddingTop: 50, // Safe area for status bar
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 0,
    margin: 0,
    marginTop: 60,
    minHeight: '40%',
    maxHeight: '90%',
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  formContainer: {
    flex: 1,
  },
  formHeader: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    marginBottom: 16,
    marginTop: 8,
  },
  formScrollContent: {
    padding: 20,
    paddingTop: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  itemsList: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    marginTop: 8,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#f3f4f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    fontSize: 14,
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemMetaText: {
    fontSize: 11,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  editCard: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  editCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  pickerOptionSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  pickerOptionText: {
    fontSize: 12,
    color: '#374151',
  },
  pickerOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  quickAddButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickAddButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  deleteButton: {
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  required: {
    color: '#ef4444',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputRequired: {
    color: '#9ca3af',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  helperMessage: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 8,
  },
  pickerError: {
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  pickerOptionDisabled: {
    opacity: 0.5,
    backgroundColor: '#e0e0e0',
  },
  pickerOptionTextDisabled: {
    color: '#9ca3af',
  },
  connectionPreview: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  previewConnection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewEntity: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  previewArrow: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  previewType: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  saveButtonDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.7,
  },
  saveButtonTextDisabled: {
    color: '#9ca3af',
  },
  emptyEntityState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEntityIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyEntityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyEntityText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#2563eb',
  },
  tabContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabPane: {
    padding: 20,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tabHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  emptyTabState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTabIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyTabText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyTabButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  emptyTabButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickAddButtonDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.7,
  },
  quickAddButtonTextDisabled: {
    color: '#9ca3af',
  },
  globalEmptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 16,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  controlButtonActive: {
    backgroundColor: '#2563eb',
    borderBottomColor: '#2563eb',
  },
  controlButtonDisabled: {
    opacity: 0.7,
  },
  templateButton: {
    backgroundColor: '#8b5cf6',
  },
  aiCreateButton: {
    backgroundColor: '#4f46e5',
  },
  controlPanelHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },

}); 
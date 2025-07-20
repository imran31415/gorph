import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useDiagramState } from './DiagramStateManager';
import { ideTheme } from '../theme/ideTheme';

interface DiagramHeaderProps {
  onShowHistory: () => void;
  onTemplatePress?: () => void;
}

export default function DiagramHeader({ onShowHistory, onTemplatePress }: DiagramHeaderProps) {
  const {
    activeDiagram,
    session,
    canUndo,
    canRedo,
    createNewDiagram,
    switchToDiagram,
    renameDiagram,
    deleteDiagram,
    undo,
    redo,
  } = useDiagramState();

  // Debug: Log when activeDiagram changes
  useEffect(() => {
    console.log('📊 DiagramHeader: activeDiagram changed:', {
      id: activeDiagram?.id,
      name: activeDiagram?.name,
      totalDiagrams: Object.keys(session.diagrams).length
    });
  }, [activeDiagram?.id, activeDiagram?.name, session.diagrams]);

  const [showDiagramModal, setShowDiagramModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newDiagramName, setNewDiagramName] = useState('');
  const [renameName, setRenameName] = useState('');
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  const handleCreateDiagram = () => {
    const name = newDiagramName.trim() || undefined;
    createNewDiagram(name);
    setNewDiagramName('');
    setShowDiagramModal(false);
  };

  const handleRenameDiagram = () => {
    if (activeDiagram && renameName.trim()) {
      renameDiagram(activeDiagram.id, renameName.trim());
      setRenameName('');
      setShowRenameModal(false);
    }
  };

  const handleDeleteDiagram = (diagramId: string) => {
    const diagram = session.diagrams[diagramId];
    Alert.alert(
      'Delete Diagram',
      `Are you sure you want to delete "${diagram.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDiagram(diagramId),
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const diagrams = Object.values(session.diagrams);

  return (
    <View style={styles.container}>
      {/* Left Section - Diagram Info */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.diagramButton}
          onPress={() => setShowDiagramModal(true)}
        >
          <Text style={styles.diagramIcon}>📁</Text>
          <View style={styles.diagramInfo}>
            <Text style={styles.diagramName}>
              {activeDiagram?.name || 'No Diagram'}
            </Text>
            <Text style={styles.diagramMeta}>
              {diagrams.length} diagram{diagrams.length !== 1 ? 's' : ''}
              {activeDiagram && ` • ${activeDiagram.changeHistory.length} changes`}
            </Text>
          </View>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Right Section - Controls */}
      <View style={styles.rightSection}>
        {/* Templates Button */}
        {onTemplatePress && (
          <TouchableOpacity
            style={[styles.controlButton, styles.templatesButton]}
            onPress={() => {
              console.log('📋 DiagramHeader: Template button clicked!');
              console.log('📋 DiagramHeader: onTemplatePress function:', typeof onTemplatePress);
              if (onTemplatePress) {
                console.log('📋 DiagramHeader: Calling onTemplatePress...');
                onTemplatePress();
                console.log('📋 DiagramHeader: onTemplatePress called successfully');
              } else {
                console.error('📋 DiagramHeader: onTemplatePress is null/undefined!');
              }
            }}
          >
            <Text style={styles.templatesIcon}>📋</Text>
            <Text style={styles.templatesText}>Templates</Text>
          </TouchableOpacity>
        )}

        {/* How It Works Button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.howItWorksButton]}
          onPress={() => setShowHowItWorksModal(true)}
        >
          <Text style={styles.controlIcon}>🎓</Text>
        </TouchableOpacity>

        {/* History Button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.historyButton]}
          onPress={onShowHistory}
        >
          <Text style={styles.controlIcon}>🕐</Text>
        </TouchableOpacity>

        {/* Undo/Redo */}
        <View style={styles.undoRedoGroup}>
          <TouchableOpacity
            style={[styles.controlButton, !canUndo && styles.disabledButton]}
            onPress={undo}
            disabled={!canUndo}
          >
            <Text style={[styles.controlIcon, !canUndo && styles.disabledIcon]}>↶</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, !canRedo && styles.disabledButton]}
            onPress={redo}
            disabled={!canRedo}
          >
            <Text style={[styles.controlIcon, !canRedo && styles.disabledIcon]}>↷</Text>
          </TouchableOpacity>
        </View>

        {/* Rename Button */}
        {activeDiagram && (
          <TouchableOpacity
            style={[styles.controlButton, styles.renameButton]}
            onPress={() => {
              setRenameName(activeDiagram.name);
              setShowRenameModal(true);
            }}
          >
            <Text style={styles.controlIcon}>✏️</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Diagram Management Modal */}
      <Modal
        visible={showDiagramModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDiagramModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Diagrams</Text>
              <Text style={styles.modalSubtitle}>
                Create, rename, or delete diagrams
              </Text>
            </View>
            
            {/* Create New Diagram */}
            <View style={styles.createDiagramSection}>
              <Text style={styles.createTitle}>Create New Diagram</Text>
              <TextInput
                style={styles.input}
                placeholder="Diagram name (optional)"
                value={newDiagramName}
                onChangeText={setNewDiagramName}
              />
              <View style={styles.createButtons}>
                <TouchableOpacity style={styles.createButton} onPress={handleCreateDiagram}>
                  <Text style={styles.createButtonText}>+ Create New</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Existing Diagrams */}
            <View style={styles.diagramsList}>
              <Text style={styles.sectionTitle}>Your Diagrams ({diagrams.length})</Text>
              <ScrollView style={styles.diagramsScroll} showsVerticalScrollIndicator={false}>
                {diagrams.length === 0 ? (
                  <Text style={styles.noDataText}>No diagrams found. Create a new one!</Text>
                ) : (
                  diagrams.map(diagram => (
                    <View key={diagram.id} style={styles.diagramItem}>
                      <TouchableOpacity
                        style={[
                          styles.diagramSelect,
                          diagram.id === activeDiagram?.id && styles.activeDiagramSelect
                        ]}
                        onPress={() => {
                          switchToDiagram(diagram.id);
                          setShowDiagramModal(false);
                        }}
                      >
                        <View style={styles.diagramSelectContent}>
                          <Text style={[
                            styles.diagramSelectName,
                            diagram.id === activeDiagram?.id && styles.activeDiagramSelectName
                          ]}>
                            {diagram.name}
                          </Text>
                          <Text style={styles.diagramSelectMeta}>
                            {formatTimestamp(diagram.lastModified)} • {diagram.changeHistory.length} changes
                          </Text>
                        </View>
                        {diagram.id === activeDiagram?.id && (
                          <Text style={styles.activeIndicator}>●</Text>
                        )}
                      </TouchableOpacity>
                      {diagrams.length > 1 && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteDiagram(diagram.id)}
                        >
                          <Text style={styles.deleteButtonText}>×</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDiagramModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.renameModal}>
            <Text style={styles.modalTitle}>Rename Diagram</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new name"
              value={renameName}
              onChangeText={setRenameName}
              autoFocus
            />
            <View style={styles.renameButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleRenameDiagram}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* How It Works Modal */}
      <Modal
        visible={showHowItWorksModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHowItWorksModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.howItWorksModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎓 How It Works</Text>
              <Text style={styles.modalSubtitle}>
                Understanding the infrastructure visualization workflow
              </Text>
            </View>

            <View style={styles.workflowContainer}>
              <View style={styles.workflowStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>🎛️ Builder OR 📝 YAML</Text>
                  <Text style={styles.stepDescription}>
                    Choose your approach: Use the Builder for visual editing OR edit YAML directly for precise control
                  </Text>
                </View>
              </View>
              
              <View style={styles.workflowArrow}>
                <Text style={styles.arrowText}>↓ generates/updates</Text>
              </View>
              
              <View style={styles.workflowStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>📝 YAML (Master Config)</Text>
                  <Text style={styles.stepDescription}>
                    The single source of truth - updated live from Builder changes or direct editing
                  </Text>
                </View>
              </View>
              
              <View style={styles.workflowArrow}>
                <Text style={styles.arrowText}>↓ compiles to</Text>
              </View>
              
              <View style={styles.workflowStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>⚙️ DOT (GraphViz)</Text>
                  <Text style={styles.stepDescription}>
                    Technical notation used by GraphViz to describe graph structures
                  </Text>
                </View>
              </View>
              
              <View style={styles.workflowArrow}>
                <Text style={styles.arrowText}>↓ renders to</Text>
              </View>
              
              <View style={styles.workflowStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>4</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>📊 Diagram (Visual)</Text>
                  <Text style={styles.stepDescription}>
                    Beautiful visual representation of your infrastructure
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.tutorialTip}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Flexible Workflow:</Text> You can work in any tab! Use the Builder for a visual interface or edit YAML directly - all tabs stay synchronized with live updates.
              </Text>
            </View>
            
            <View style={styles.tutorialTip}>
              <Text style={styles.tipIcon}>📁</Text>
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Multiple Diagrams:</Text> Create multiple diagram versions using this top bar. Access your change history with the history button to see all modifications and revert if needed.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHowItWorksModal(false)}
            >
              <Text style={styles.closeButtonText}>Got It!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ideTheme.spacing.xl,
    paddingVertical: ideTheme.spacing.lg,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 72,
  },
  leftSection: {
    flex: 1,
    maxWidth: '50%',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diagramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 48,
    maxWidth: 280,
    flex: 1,
  },
  diagramIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  diagramInfo: {
    flex: 1,
    marginRight: 12,
  },
  diagramName: {
    fontSize: ideTheme.typography.ui.fontSize + 1,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
    fontFamily: ideTheme.fonts.system,
    letterSpacing: ideTheme.typography.ui.letterSpacing,
  },
  diagramMeta: {
    fontSize: ideTheme.typography.small.fontSize,
    color: '#64748b',
    fontWeight: '500',
    fontFamily: ideTheme.fonts.system,
    letterSpacing: ideTheme.typography.small.letterSpacing,
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  controlIcon: {
    fontSize: 18,
    color: '#374151',
  },
  disabledButton: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    opacity: 0.6,
  },
  disabledIcon: {
    color: '#9ca3af',
  },
  historyButton: {
    backgroundColor: '#ede9fe',
    borderColor: '#d8b4fe',
  },
  renameButton: {
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
  },
  undoRedoGroup: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: '85%',
    width: '90%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  createDiagramSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  createTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  createButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  diagramsList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  diagramsScroll: {
    maxHeight: 300,
  },
  diagramItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagramSelect: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  activeDiagramSelect: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  diagramSelectContent: {
    flex: 1,
  },
  diagramSelectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  activeDiagramSelectName: {
    color: '#1e40af',
  },
  diagramSelectMeta: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeIndicator: {
    fontSize: 12,
    color: '#3b82f6',
    marginLeft: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  closeButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  renameModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  renameButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  templatesButton: {
    backgroundColor: '#dbeafe',
    borderColor: '#60a5fa',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    minWidth: 100,
    justifyContent: 'center',
  },
  templatesIcon: {
    fontSize: 16,
    color: '#1d4ed8',
  },
  templatesText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
    fontFamily: ideTheme.fonts.system,
  },
  howItWorksButton: {
    backgroundColor: '#e0f2fe',
    borderColor: '#90cdf4',
  },
  howItWorksModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  workflowContainer: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  workflowStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#90cdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  workflowArrow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  arrowText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  tutorialTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '600',
  },
}); 
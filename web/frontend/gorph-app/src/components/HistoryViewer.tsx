import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useDiagramState, DiagramChange } from './DiagramStateManager';
import { ideTheme } from '../theme/ideTheme';

interface HistoryViewerProps {
  visible: boolean;
  onClose: () => void;
}

export default function HistoryViewer({ visible, onClose }: HistoryViewerProps) {
  const {
    activeDiagram,
    getChangeHistory,
    revertToChange,
    canUndo,
    canRedo,
    undo,
    redo,
  } = useDiagramState();

  const [selectedChange, setSelectedChange] = useState<DiagramChange | null>(null);
  const [showRevertConfirm, setShowRevertConfirm] = useState<DiagramChange | null>(null);

  const history = getChangeHistory();
  const currentIndex = activeDiagram?.currentChangeIndex ?? -1;

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getChangeIcon = (changeType: DiagramChange['changeType']) => {
    switch (changeType) {
      case 'manual': return '✏️';
      case 'template': return '📋';
      case 'builder': return '🏗️';
      case 'undo': return '↶';
      case 'redo': return '↷';
      default: return '📝';
    }
  };

  const getChangeTypeColor = (changeType: DiagramChange['changeType']) => {
    switch (changeType) {
      case 'manual': return '#3b82f6';
      case 'template': return '#10b981';
      case 'builder': return '#f59e0b';
      case 'undo': return '#6b7280';
      case 'redo': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const handleRevertToChange = (change: DiagramChange) => {
    setShowRevertConfirm(change);
  };

  const confirmRevertToChange = () => {
    if (showRevertConfirm) {
      revertToChange(showRevertConfirm.id);
      setShowRevertConfirm(null);
      onClose();
    }
  };

  const getDiffStats = (yamlContent: string) => {
    const entityCount = (yamlContent.match(/- id:/g) || []).length;
    const connectionCount = (yamlContent.match(/- from:/g) || []).length;
    return { entityCount, connectionCount };
  };

  if (!activeDiagram) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.noDataText}>No active diagram to show history</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Change History</Text>
            <Text style={styles.subtitle}>
              {activeDiagram.name} • {history.length} changes
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, !canUndo && styles.disabledButton]}
              onPress={() => {
                undo();
                onClose();
              }}
              disabled={!canUndo}
            >
              <Text style={[styles.actionIcon, !canUndo && styles.disabledText]}>↶</Text>
              <Text style={[styles.actionText, !canUndo && styles.disabledText]}>Undo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, !canRedo && styles.disabledButton]}
              onPress={() => {
                redo();
                onClose();
              }}
              disabled={!canRedo}
            >
              <Text style={[styles.actionIcon, !canRedo && styles.disabledText]}>↷</Text>
              <Text style={[styles.actionText, !canRedo && styles.disabledText]}>Redo</Text>
            </TouchableOpacity>
          </View>

          {/* History Timeline */}
          <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
            {history.slice().reverse().map((change, reverseIndex) => {
              const index = history.length - 1 - reverseIndex;
              const isCurrent = index === currentIndex;
              const isAfterCurrent = index > currentIndex;
              const stats = getDiffStats(change.yamlContent);
              
              return (
                <View key={change.id} style={styles.timelineItem}>
                  {/* Timeline Line */}
                  <View style={styles.timelineConnector}>
                    <View style={[
                      styles.timelineDot,
                      isCurrent && styles.currentDot,
                      isAfterCurrent && styles.futureDot,
                    ]} />
                    {index < history.length - 1 && (
                      <View style={[
                        styles.timelineLine,
                        isAfterCurrent && styles.futureLine,
                      ]} />
                    )}
                  </View>

                  {/* Change Content */}
                  <TouchableOpacity
                    style={[
                      styles.changeCard,
                      isCurrent && styles.currentChangeCard,
                      isAfterCurrent && styles.futureChangeCard,
                    ]}
                    onPress={() => setSelectedChange(change)}
                    onLongPress={() => handleRevertToChange(change)}
                  >
                    <View style={styles.changeHeader}>
                      <View style={styles.changeInfo}>
                        <Text style={styles.changeIcon}>
                          {getChangeIcon(change.changeType)}
                        </Text>
                        <View style={styles.changeDetails}>
                          <Text style={[
                            styles.changeDescription,
                            isAfterCurrent && styles.futureText,
                          ]}>
                            {change.description}
                          </Text>
                          <Text style={[
                            styles.changeTime,
                            isAfterCurrent && styles.futureText,
                          ]}>
                            {formatTimestamp(change.timestamp)}
                          </Text>
                        </View>
                      </View>
                      
                      {isCurrent && (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Current</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.changeStats}>
                      <Text style={[
                        styles.statText,
                        isAfterCurrent && styles.futureText,
                      ]}>
                        {stats.entityCount} entities • {stats.connectionCount} connections
                      </Text>
                      <View style={[
                        styles.changeTypeBadge,
                        { backgroundColor: getChangeTypeColor(change.changeType) + '20' }
                      ]}>
                        <Text style={[
                          styles.changeTypeBadgeText,
                          { color: getChangeTypeColor(change.changeType) }
                        ]}>
                          {change.changeType}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerHint}>
              Tap to view details • Long press to revert
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Revert Confirmation Modal */}
        {showRevertConfirm && (
          <Modal
            visible={!!showRevertConfirm}
            transparent
            animationType="fade"
            onRequestClose={() => setShowRevertConfirm(null)}
          >
            <View style={styles.detailModalOverlay}>
              <View style={styles.confirmModal}>
                <Text style={styles.confirmTitle}>🔄 Revert to Change</Text>
                <Text style={styles.confirmMessage}>
                  Are you sure you want to revert to this change?
                </Text>
                <Text style={styles.confirmDetails}>
                  "{showRevertConfirm.description}"
                </Text>
                <Text style={styles.confirmWarning}>
                  This will update your current diagram and may lose recent changes.
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.confirmCancelButton}
                    onPress={() => setShowRevertConfirm(null)}
                  >
                    <Text style={styles.confirmCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmRevertButton}
                    onPress={confirmRevertToChange}
                  >
                    <Text style={styles.confirmRevertButtonText}>Revert</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Change Detail Modal */}
        {selectedChange && (
          <Modal
            visible={!!selectedChange}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedChange(null)}
          >
            <View style={styles.detailModalOverlay}>
              <View style={styles.detailModalContent}>
                <Text style={styles.detailTitle}>Change Details</Text>
                
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{selectedChange.description}</Text>
                </View>

                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>
                    {getChangeIcon(selectedChange.changeType)} {selectedChange.changeType}
                  </Text>
                </View>

                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedChange.timestamp).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Content:</Text>
                  <ScrollView style={styles.yamlPreview}>
                    <Text style={styles.yamlText}>
                      {selectedChange.yamlContent || 'Empty diagram'}
                    </Text>
                  </ScrollView>
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={styles.detailCloseButton}
                    onPress={() => setSelectedChange(null)}
                  >
                    <Text style={styles.detailCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.detailRevertButton}
                    onPress={() => {
                      setSelectedChange(null);
                      handleRevertToChange(selectedChange);
                    }}
                  >
                    <Text style={styles.detailRevertButtonText}>Revert to This</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    maxWidth: 600,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#f8fafc',
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  disabledText: {
    color: '#cbd5e1',
  },
  timeline: {
    flex: 1,
    maxHeight: 400,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineConnector: {
    alignItems: 'center',
    marginRight: 12,
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    marginBottom: 4,
  },
  currentDot: {
    backgroundColor: '#10b981',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  futureDot: {
    backgroundColor: '#cbd5e1',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0',
  },
  futureLine: {
    backgroundColor: '#f1f5f9',
  },
  changeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currentChangeCard: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  futureChangeCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#f1f5f9',
  },
  changeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  changeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  changeIcon: {
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  changeDetails: {
    flex: 1,
  },
  changeDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  changeTime: {
    fontSize: ideTheme.typography.small.fontSize,
    color: '#64748b',
    fontFamily: ideTheme.fonts.system,
    letterSpacing: ideTheme.typography.small.letterSpacing,
  },
  futureText: {
    color: '#9ca3af',
  },
  currentBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  changeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    color: '#6b7280',
  },
  changeTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  changeTypeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  // Detail Modal Styles
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailInfo: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
  },
  yamlPreview: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 12,
    maxHeight: 200,
  },
  yamlText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  detailCloseButton: {
    flex: 1,
    backgroundColor: '#6b7280',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  detailCloseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailRevertButton: {
    flex: 1,
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  detailRevertButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Confirmation Modal Styles
  confirmModal: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  confirmWarning: {
    fontSize: 13,
    color: '#dc2626',
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  confirmCancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmRevertButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmRevertButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
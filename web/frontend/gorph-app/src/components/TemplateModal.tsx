import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform } from 'react-native';

interface Template {
  name: string;
  yaml: string;
  description?: string;
}

interface TemplateModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  templates: Record<string, Template>;
}

export default function TemplateModal({ visible, onClose, onSelectTemplate, templates }: TemplateModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📋 Select Template</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.templateList} 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.templateListContent}
          >
            {Object.entries(templates).length === 0 ? (
              <View style={styles.noTemplates}>
                <Text style={styles.noTemplatesText}>No templates available</Text>
              </View>
            ) : (
              Object.entries(templates).map(([key, template]) => (
              <TouchableOpacity
                key={key}
                style={styles.templateCard}
                onPress={() => onSelectTemplate(template)}
              >
                <View style={styles.templateHeader}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <View style={styles.templateBadge}>
                    <Text style={styles.templateBadgeText}>Template</Text>
                  </View>
                </View>
                {template.description && (
                  <Text style={styles.templateDescription}>{template.description}</Text>
                )}
                <View style={styles.templatePreview}>
                  <Text style={styles.previewText} numberOfLines={3}>
                    {template.yaml.split('\n').slice(0, 6).join('\n')}...
                  </Text>
                </View>
                              </TouchableOpacity>
              ))
            )}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 600,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  templateList: {
    flex: 1,
    padding: 20,
  },
  templateListContent: {
    paddingBottom: 20, // Add some padding at the bottom for the footer
  },
  templateCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  templateBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  templateBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  templateDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  templatePreview: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  previewText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#374151',
    lineHeight: 16,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  noTemplates: {
    padding: 20,
    alignItems: 'center',
  },
  noTemplatesText: {
    fontSize: 16,
    color: '#6b7280',
    fontStyle: 'italic',
  },
}); 
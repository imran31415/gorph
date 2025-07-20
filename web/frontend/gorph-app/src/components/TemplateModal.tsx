import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';

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

export default function TemplateModal({ 
  visible, 
  onClose, 
  onSelectTemplate, 
  templates 
}: TemplateModalProps) {
  console.log('🚨 TemplateModal: COMPONENT CALLED - visible:', visible, 'Platform:', Platform.OS, 'templates count:', Object.keys(templates).length);
  
  if (!visible) {
    console.log('📋 TemplateModal: Not visible, returning null');
    return null;
  }

  console.log('🚨 TemplateModal: RENDERING OVERLAY!!! 🚨');

  const templateKeys = Object.keys(templates);
  console.log('📋 TemplateModal: Available templates:', templateKeys);

  return (
    <View style={styles.overlay}>
      {/* Background overlay that closes modal when pressed */}
      <TouchableOpacity 
        style={styles.backgroundOverlay} 
        onPress={onClose}
        activeOpacity={1}
      />
      
      {/* Modal content */}
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Choose Template</Text>
          <Text style={styles.modalSubtitle}>
            Select a template to get started quickly
          </Text>
        </View>
        
        {/* Templates */}
        <ScrollView style={styles.templatesContainer} showsVerticalScrollIndicator={false}>
          {templateKeys.length === 0 ? (
            <View style={styles.noTemplates}>
              <Text style={styles.noTemplatesText}>No templates available</Text>
            </View>
          ) : (
            templateKeys.map((key) => {
              const template = templates[key];
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.templateCard}
                  onPress={() => {
                    console.log('📋 TemplateModal: Template selected:', key);
                    onSelectTemplate(template);
                    onClose();
                  }}
                >
                  <View style={styles.templateHeader}>
                    <Text style={styles.templateIcon}>
                      {key === 'simple' ? '🏗️' :
                       key === 'webapp' ? '🌐' :
                       key === 'microservices' ? '🔄' :
                       key === 'data-pipeline' ? '📊' :
                       key === 'deploy' ? '🚀' :
                       '⚙️'}
                    </Text>
                    <View style={styles.templateInfo}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templateDescription}>
                        {template.description || 'Infrastructure template'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.templateAction}>Use Template →</Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
        
        {/* Footer */}
        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...Platform.OS === 'web' ? {
      position: 'fixed' as any,
    } : {
      position: 'absolute',
    },
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '95%',
    minWidth: 280,
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 10000,
  },
  modalHeader: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  templatesContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 16,
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
  templateCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  templateAction: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    textAlign: 'right',
  },
  modalFooter: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
    lineHeight: 20,
  },
}); 
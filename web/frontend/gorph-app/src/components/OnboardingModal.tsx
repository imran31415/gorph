import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  templates: Record<string, any>;
  onSelectTemplate: (template: any) => void;
}

export default function OnboardingModal({ visible, onClose, templates, onSelectTemplate }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'how-it-works' | 'templates'>('welcome');
  

  
  const handleTemplateSelect = (template: any) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleSkipToBlank = () => {
    onSelectTemplate({
      name: 'Blank Template',
      description: 'Start from scratch',
      yaml: ''
    });
    onClose();
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.welcomeHeader}>
        <Text style={styles.welcomeIcon}>🎯</Text>
        <Text style={styles.welcomeTitle}>Welcome to Gorph!</Text>
        <Text style={styles.welcomeSubtitle}>
          Infrastructure visualization made simple
        </Text>
      </View>
      
      <View style={styles.welcomeDescription}>
        <Text style={styles.descriptionText}>
          Gorph helps you create beautiful infrastructure diagrams from simple YAML definitions. 
          Whether you're documenting existing systems or designing new ones, we make it easy.
        </Text>
      </View>
      
      <View style={styles.features}>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>🎛️</Text>
          <Text style={styles.featureText}>Visual Builder</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>📝</Text>
          <Text style={styles.featureText}>YAML Editor</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureIcon}>📊</Text>
          <Text style={styles.featureText}>Live Diagrams</Text>
        </View>
      </View>
      
      <View style={styles.stepButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentStep('how-it-works')}
        >
          <Text style={styles.secondaryButtonText}>Learn How It Works</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setCurrentStep('templates')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHowItWorksStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>🎓 How It Works</Text>
        <Text style={styles.stepSubtitle}>
          Understanding the infrastructure visualization workflow
        </Text>
      </View>

      <ScrollView style={styles.workflowContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.workflowStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepDetails}>
            <Text style={styles.stepDetailsTitle}>🎛️ Builder OR 📝 YAML</Text>
            <Text style={styles.stepDetailsDescription}>
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
          <View style={styles.stepDetails}>
            <Text style={styles.stepDetailsTitle}>📝 YAML (Master Config)</Text>
            <Text style={styles.stepDetailsDescription}>
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
          <View style={styles.stepDetails}>
            <Text style={styles.stepDetailsTitle}>⚙️ DOT (GraphViz)</Text>
            <Text style={styles.stepDetailsDescription}>
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
          <View style={styles.stepDetails}>
            <Text style={styles.stepDetailsTitle}>📊 Diagram (Visual)</Text>
            <Text style={styles.stepDetailsDescription}>
              Beautiful visual representation of your infrastructure
            </Text>
          </View>
        </View>
        
        <View style={styles.tutorialTip}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>Flexible Workflow:</Text> You can work in any tab! Use the Builder for a visual interface or edit YAML directly - all tabs stay synchronized with live updates.
          </Text>
        </View>
        
        <View style={styles.tutorialTip}>
          <Text style={styles.tipIcon}>🔄</Text>
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>Multiple Versions:</Text> Create multiple diagram versions and access history from the top bar to compare different designs or track changes over time.
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.stepButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentStep('welcome')}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setCurrentStep('templates')}
        >
          <Text style={styles.primaryButtonText}>Choose Template</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTemplatesStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>🎯 Choose Your Starting Point</Text>
        <Text style={styles.stepSubtitle}>
          Select a template to get started quickly, or start with a blank slate
        </Text>
      </View>

      <ScrollView style={styles.templatesContainer} showsVerticalScrollIndicator={false}>
        {/* Blank Template Option */}
        <TouchableOpacity
          style={[styles.templateCard, styles.blankTemplateCard]}
          onPress={handleSkipToBlank}
        >
          <View style={styles.templateHeader}>
            <Text style={styles.templateIcon}>📝</Text>
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>Blank Template</Text>
              <Text style={styles.templateDescription}>
                Start from scratch and build your own infrastructure diagram
              </Text>
            </View>
          </View>
          <Text style={styles.templateAction}>Start Building →</Text>
        </TouchableOpacity>

        {/* Template Options */}
        {Object.entries(templates).map(([key, template]) => (
          <TouchableOpacity
            key={key}
            style={styles.templateCard}
            onPress={() => handleTemplateSelect(template)}
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
                  {template.description}
                </Text>
              </View>
            </View>
            <Text style={styles.templateAction}>Use Template →</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.stepButtons}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentStep('how-it-works')}
        >
          <Text style={styles.secondaryButtonText}>How It Works</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tertiaryButton}
          onPress={onClose}
        >
          <Text style={styles.tertiaryButtonText}>Skip Setup</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, currentStep === 'welcome' && styles.progressDotActive]} />
            <View style={[styles.progressDot, currentStep === 'how-it-works' && styles.progressDotActive]} />
            <View style={[styles.progressDot, currentStep === 'templates' && styles.progressDotActive]} />
          </View>

          {/* Step Content */}
          {currentStep === 'welcome' && renderWelcomeStep()}
          {currentStep === 'how-it-works' && renderHowItWorksStep()}
          {currentStep === 'templates' && renderTemplatesStep()}

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    position: 'relative',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#2563eb',
  },
  stepContent: {
    flex: 1,
    padding: 24,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
  },
  welcomeDescription: {
    marginBottom: 32,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4b5563',
    textAlign: 'center',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  workflowContainer: {
    flex: 1,
    marginBottom: 24,
  },
  workflowStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepDetails: {
    flex: 1,
  },
  stepDetailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  stepDetailsDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  workflowArrow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  arrowText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  tutorialTip: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '600',
    color: '#1f2937',
  },
  templatesContainer: {
    flex: 1,
    marginBottom: 24,
  },
  templateCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  blankTemplateCard: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
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
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  templateAction: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    textAlign: 'right',
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
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
  },
}); 
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Dimensions, Platform } from 'react-native';

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  templates: Record<string, any>;
  onSelectTemplate: (template: any) => void;
  onAIGenerate?: () => void;
}

export default function OnboardingModal({ visible, onClose, templates, onSelectTemplate, onAIGenerate }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<'welcome' | 'how-it-works' | 'templates'>('welcome');
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));

  // Track screen dimensions for Safari mobile viewport changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Calculate safe modal height for mobile Safari
  const isMobile = Platform.OS !== 'web' || screenDimensions.width < 768;
  const isVeryShortScreen = screenDimensions.height < 600;
  

  
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
      <ScrollView style={styles.welcomeScrollContent} showsVerticalScrollIndicator={false}>
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
      </ScrollView>
      
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
    <View style={[styles.stepContent, isMobile && styles.stepContentMobileTemplates]}>
      <View style={[styles.stepHeader, isMobile && styles.stepHeaderMobileTemplates]}>
        <Text style={styles.stepTitle}>🎯 Choose Your Starting Point</Text>
        <Text style={styles.stepSubtitle}>
          Generate with AI, select a template, or start with a blank slate
        </Text>
      </View>

      <ScrollView style={[styles.templatesContainer, isMobile && styles.templatesContainerMobile]} showsVerticalScrollIndicator={false}>
        {/* AI Generate Option */}
        {onAIGenerate && (
          <TouchableOpacity
            style={[styles.templateCard, styles.aiTemplateCard]}
            onPress={() => {
              onAIGenerate();
              onClose();
            }}
          >
            <View style={styles.templateHeader}>
              <Text style={styles.templateIcon}>🤖</Text>
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>AI Generate</Text>
                <Text style={styles.templateDescription}>
                  Describe your system in natural language and let AI create the diagram
                </Text>
              </View>
            </View>
            <Text style={styles.templateAction}>Generate with AI →</Text>
          </TouchableOpacity>
        )}

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
      
      <View style={[styles.stepButtons, isMobile && styles.stepButtonsMobileTemplates]}>
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
        <View style={[
          styles.modalContainer,
          isMobile && styles.modalContainerMobile,
          isMobile && currentStep === 'templates' && styles.modalContainerMobileTemplates,
          isVeryShortScreen && styles.modalContainerShort
        ]}>
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
    paddingTop: 60, // Extra top padding for mobile
    paddingBottom: 60, // Extra bottom padding for mobile
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '85%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalContainerMobile: {
    margin: 10,
    maxWidth: '96%',
    maxHeight: '82%',
  },
  modalContainerMobileTemplates: {
    margin: 8,
    maxWidth: '98%',
    maxHeight: '92%',
    height: '92%',
  },
  modalContainerShort: {
    maxHeight: '78%',
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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 0,
    overflow: 'auto',
  },
  stepContentMobileTemplates: {
    padding: 16,
    paddingBottom: 8,
  },
  welcomeScrollContent: {
    flex: 1,
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
    marginBottom: 24,
    flex: 1,
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
    marginBottom: 16,
    flexShrink: 0,
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
  stepHeaderMobileTemplates: {
    marginBottom: 16,
    paddingHorizontal: 8,
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
  templatesContainerMobile: {
    flex: 1,
    marginBottom: 12,
    paddingHorizontal: 4,
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
  aiTemplateCard: {
    backgroundColor: '#f3f1ff',
    borderColor: '#d1c4e9',
    borderWidth: 2,
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
    marginTop: 20,
    flexShrink: 0,
  },
  stepButtonsMobileTemplates: {
    marginTop: 12,
    paddingHorizontal: 8,
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
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
  },
}); 
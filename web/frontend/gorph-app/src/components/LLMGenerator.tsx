import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, Platform } from 'react-native';
import APIKeyConfig from './APIKeyConfig';

interface LLMGeneratorProps {
  onYamlGenerated: (yaml: string) => void;
  onClose: () => void;
  visible: boolean;
}

interface GenerationExample {
  title: string;
  description: string;
  prompt: string;
}

const EXAMPLES: GenerationExample[] = [
  {
    title: "Car Engine Operation",
    description: "Complex mechanical system with intake, compression, combustion, and exhaust cycles",
    prompt: "Design a graph of a car engine operation showing the flow from air intake through combustion to exhaust"
  },
  {
    title: "E-commerce Platform",
    description: "Web application with user authentication, product catalog, and payment processing",
    prompt: "Create a diagram for an e-commerce platform with user registration, product browsing, shopping cart, and payment processing"
  },
  {
    title: "Data Pipeline",
    description: "ETL system processing data from multiple sources to analytics dashboard",
    prompt: "Design a data pipeline that collects data from multiple APIs, processes it, stores in a data warehouse, and displays in dashboards"
  },
  {
    title: "Microservices Architecture",
    description: "Distributed system with API gateway, multiple services, and shared databases",
    prompt: "Create a microservices architecture for a social media platform with user management, posts, messaging, and notifications"
  }
];

export const LLMGenerator: React.FC<LLMGeneratorProps> = ({ onYamlGenerated, onClose, visible }) => {
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedYaml, setGeneratedYaml] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [showExamples, setShowExamples] = useState(true);
  const [showAPIConfig, setShowAPIConfig] = useState(false);
  const [hasAPIKey, setHasAPIKey] = useState(false);

  // Check for API keys when component mounts
  React.useEffect(() => {
    if (visible) {
      checkForAPIKeys();
    }
  }, [visible]);

  const checkForAPIKeys = () => {
    const openaiKey = localStorage?.getItem('openai_api_key');
    const anthropicKey = localStorage?.getItem('anthropic_api_key');
    const geminiKey = localStorage?.getItem('gemini_api_key');
    
    setHasAPIKey(Boolean(openaiKey || anthropicKey || geminiKey));
  };

  const getCurrentProviderName = () => {
    const openaiKey = localStorage?.getItem('openai_api_key');
    const anthropicKey = localStorage?.getItem('anthropic_api_key');
    const geminiKey = localStorage?.getItem('gemini_api_key');
    
    if (openaiKey) return 'OpenAI';
    if (anthropicKey) return 'Anthropic Claude';
    if (geminiKey) return 'Google Gemini';
    return 'Unknown';
  };

  // Clean generated YAML from markdown formatting
  const cleanGeneratedYaml = (rawYaml: string): string => {
    let cleaned = rawYaml.trim();
    
    // Remove markdown code block formatting
    if (cleaned.startsWith('```yaml')) {
      cleaned = cleaned.substring(7); // Remove ```yaml
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3); // Remove ```
    }
    
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3); // Remove ending ```
    }
    
    return cleaned.trim();
  };

  const generateYamlFromDescription = async (description: string, isRefinement: boolean = false) => {
    setIsGenerating(true);
    
    try {
      const prompt = createGorphPrompt(description, isRefinement ? conversationHistory : []);
      
      // TODO: Replace with actual API integration
      const response = await callLLMAPI(prompt);
      
      if (response.yaml) {
        // Clean the YAML from markdown formatting
        const cleanedYaml = cleanGeneratedYaml(response.yaml);
        setGeneratedYaml(cleanedYaml);
        
        // Add to conversation history
        const newHistory = [
          ...conversationHistory,
          { role: 'user' as const, content: description },
          { role: 'assistant' as const, content: cleanedYaml }
        ];
        setConversationHistory(newHistory);
        
        // Validate the cleaned YAML
        await validateGeneratedYaml(cleanedYaml);
      }
    } catch (error) {
      console.error('LLM Generation Error:', error);
      Alert.alert('Generation Error', 'Failed to generate YAML. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const callLLMAPI = async (prompt: string) => {
    const { createLLMService } = await import('../services/llmService');
    const llmService = createLLMService();
    
    if (!llmService) {
      // Fallback to mock for demo purposes
      console.log('No LLM API key configured, using mock response');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (prompt.toLowerCase().includes('car engine') || prompt.toLowerCase().includes('engine operation')) {
        return {
          yaml: `\`\`\`yaml
entities:
  - id: AirIntake
    category: NETWORK
    description: "Air intake system providing oxygen for combustion"
    status: healthy
    owner: engine-team
    environment: production
    attributes:
      component_type: intake_system

  - id: FuelInjector
    category: BACKEND
    description: "Fuel injection system controlling fuel delivery"
    status: healthy
    owner: engine-team
    environment: production
    attributes:
      component_type: fuel_system

  - id: CombustionChamber
    category: BACKEND
    description: "Main combustion chamber where fuel-air mixture ignites"
    status: healthy
    owner: engine-team
    environment: production
    attributes:
      component_type: combustion_core
      temperature: high

  - id: Piston
    category: INFRASTRUCTURE
    description: "Piston mechanism converting combustion pressure to motion"
    status: healthy
    owner: engine-team
    environment: production
    attributes:
      component_type: mechanical

  - id: Crankshaft
    category: INFRASTRUCTURE
    description: "Crankshaft converting linear piston motion to rotational motion"
    status: healthy
    owner: engine-team
    environment: production
    attributes:
      component_type: power_output

  - id: ExhaustSystem
    category: NETWORK
    description: "Exhaust system removing burnt gases"
    status: healthy
    owner: engine-team
    environment: production
    attributes:
      component_type: exhaust_system

connections:
  - from: AirIntake
    to: CombustionChamber
    type: Service_Call
  - from: FuelInjector
    to: CombustionChamber
    type: Service_Call
  - from: CombustionChamber
    to: Piston
    type: Triggers_Build
  - from: Piston
    to: Crankshaft
    type: Service_Call
  - from: CombustionChamber
    to: ExhaustSystem
    type: Service_Call
\`\`\``
        };
      }
      
      return {
        yaml: `\`\`\`yaml
entities:
  - id: UserDescription
    category: USER_FACING
    description: "Generated from: ${prompt.substring(0, 100)}..."
    status: healthy
    owner: ai-generated
    environment: production

connections: []
\`\`\``
      };
    }

    // Use real LLM service
    return await llmService.generateYAML(prompt);
  };

  const createGorphPrompt = (userDescription: string, history: Array<{role: 'user' | 'assistant', content: string}>) => {
    const { createGorphPrompt } = require('../services/llmService');
    return createGorphPrompt(userDescription, history);
  };

  const validateGeneratedYaml = async (yaml: string) => {
    // TODO: Integrate with existing WASM validation
    console.log('Validating generated YAML:', yaml);
  };

  const handleExampleClick = (example: GenerationExample) => {
    setUserInput(example.prompt);
    setShowExamples(false);
  };

  const handleGenerate = () => {
    if (!userInput.trim()) return;
    generateYamlFromDescription(userInput);
  };

  const handleRefine = () => {
    if (!userInput.trim()) return;
    generateYamlFromDescription(userInput, true);
  };

  const handleUseYaml = () => {
    if (generatedYaml) {
      // Extra safety: ensure YAML is clean before using
      const finalYaml = cleanGeneratedYaml(generatedYaml);
      onYamlGenerated(finalYaml);
      onClose();
    }
  };

  const handleClear = () => {
    setUserInput('');
    setGeneratedYaml('');
    setConversationHistory([]);
    setShowExamples(true);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        {/* Minimal Header */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        }}>
          <Text style={{ color: '#1e293b', fontSize: 20, fontWeight: '600' }}>
            AI Designer
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => setShowAPIConfig(true)} 
              style={{ 
                padding: 8, 
                marginRight: 8,
                borderRadius: 6,
              }}
            >
              <Text style={{ color: '#6b7280', fontSize: 16 }}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Text style={{ color: '#9ca3af', fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          {/* Minimal API Status */}
          {hasAPIKey && (
            <View style={{
              backgroundColor: '#f8fffe',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              marginBottom: 24,
              borderLeftWidth: 3,
              borderLeftColor: '#10b981',
            }}>
              <Text style={{ color: '#065f46', fontSize: 13, fontWeight: '500' }}>
                {getCurrentProviderName()} connected
              </Text>
            </View>
          )}

          {/* API Setup Notice */}
          {!hasAPIKey && (
            <View style={{
              backgroundColor: '#fefce8',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              marginBottom: 24,
              borderLeftWidth: 3,
              borderLeftColor: '#eab308',
            }}>
              <Text style={{ color: '#713f12', fontSize: 13, fontWeight: '500', marginBottom: 8 }}>
                API key required
              </Text>
              <TouchableOpacity
                onPress={() => setShowAPIConfig(true)}
                style={{
                  backgroundColor: '#1e293b',
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 6,
                  alignSelf: 'flex-start'
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '500' }}>
                  Setup
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Examples */}
          {showExamples && hasAPIKey && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#6b7280', fontSize: 14, fontWeight: '500', marginBottom: 12, textAlign: 'center' }}>
                Try an example:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                {EXAMPLES.map((example, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleExampleClick(example)}
                    style={{
                      backgroundColor: '#f1f5f9',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                    }}
                  >
                    <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>
                      {example.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Clean Input Section */}
          <View style={{ 
            marginBottom: 32, 
            maxWidth: 600, 
            alignSelf: 'center', 
            width: '100%' 
          }}>
            <Text style={{ 
              color: '#1e293b', 
              fontSize: 18, 
              marginBottom: 16, 
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Describe your infrastructure
            </Text>
            <TextInput
              value={userInput}
              onChangeText={setUserInput}
              placeholder="e.g., Design a graph of a car engine operation..."
              placeholderTextColor="#9ca3af"
              multiline
              style={{
                backgroundColor: '#fafbfc',
                color: '#1e293b',
                padding: 20,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                fontSize: 16,
                textAlignVertical: 'top',
                minHeight: 120,
                lineHeight: 24,
                fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
              }}
            />
          </View>

          {/* Clean Action Buttons */}
          <View style={{ 
            marginBottom: 20, 
            maxWidth: 400, 
            alignSelf: 'center', 
            width: '100%' 
          }}>
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={!userInput.trim() || isGenerating || !hasAPIKey}
              style={{
                backgroundColor: userInput.trim() && !isGenerating && hasAPIKey ? '#6366f1' : '#e5e7eb',
                paddingVertical: 16,
                paddingHorizontal: 24,
                borderRadius: 10,
                alignItems: 'center',
                marginBottom: 12,
                shadowColor: userInput.trim() && !isGenerating && hasAPIKey ? '#6366f1' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text style={{ 
                color: userInput.trim() && !isGenerating && hasAPIKey ? '#ffffff' : '#9ca3af', 
                fontSize: 16, 
                fontWeight: '600' 
              }}>
                {isGenerating ? 'Generating...' : !hasAPIKey ? 'Configure API First' : 'Generate Infrastructure'}
              </Text>
            </TouchableOpacity>

            {conversationHistory.length > 0 && (
              <TouchableOpacity
                onPress={handleRefine}
                disabled={!userInput.trim() || isGenerating}
                style={{
                  backgroundColor: '#f59e0b',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '500' }}>
                  Refine Result
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleClear}
              style={{
                backgroundColor: 'transparent',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 6,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#6b7280', fontSize: 14, fontWeight: '500' }}>
                Clear
              </Text>
            </TouchableOpacity>
          </View>

          {/* Generated YAML Section */}
          {generatedYaml && (
            <View style={{ 
              marginBottom: 20,
              backgroundColor: '#ffffff',
              padding: 16,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
              <View style={{ marginBottom: 15 }}>
                <Text style={{ color: '#1e293b', fontSize: 18, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' }}>
                  🎉 Your YAML is Ready!
                </Text>
                <TouchableOpacity
                  onPress={handleUseYaml}
                  style={{
                    backgroundColor: '#10b981',
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    alignItems: 'center',
                    shadowColor: '#10b981',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                    marginBottom: 15
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>
                    ✅ Use This YAML
                  </Text>
                  <Text style={{ color: '#ffffff', fontSize: 14, opacity: 0.9, marginTop: 4 }}>
                    Apply to your diagram
                  </Text>
                </TouchableOpacity>
              </View>
              
              <Text style={{ color: '#6b7280', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                📄 Generated YAML Preview:
              </Text>
              <ScrollView 
                style={{
                  backgroundColor: '#f1f5f9',
                  borderRadius: 8,
                  maxHeight: 400,
                  borderWidth: 1,
                  borderColor: '#e2e8f0'
                }}
                horizontal={true}
              >
                <Text style={{
                  color: '#1e293b',
                  fontFamily: 'monospace',
                  fontSize: 14,
                  padding: 15,
                  lineHeight: 20
                }}>
                  {generatedYaml}
                </Text>
              </ScrollView>
            </View>
          )}

          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <View style={{ 
              marginBottom: 20,
              backgroundColor: '#ffffff',
              padding: 16,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
              <Text style={{ color: '#1e293b', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
                💬 Conversation History:
              </Text>
              {conversationHistory.map((msg, index) => (
                <View key={index} style={{ marginBottom: 10 }}>
                  <Text style={{ 
                    color: msg.role === 'user' ? '#10b981' : '#f59e0b', 
                    fontSize: 14, 
                    fontWeight: 'bold' 
                  }}>
                    {msg.role === 'user' ? '👤 You:' : '🤖 AI:'}
                  </Text>
                  <Text style={{ color: '#6b7280', fontSize: 14, marginLeft: 10 }}>
                    {msg.role === 'user' ? msg.content : 'Generated YAML (see above)'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* API Key Configuration Modal */}
      <APIKeyConfig
        visible={showAPIConfig}
        onClose={() => {
          setShowAPIConfig(false);
          checkForAPIKeys(); // Re-check for API keys after configuration
        }}
      />
    </Modal>
  );
};

export default LLMGenerator; 
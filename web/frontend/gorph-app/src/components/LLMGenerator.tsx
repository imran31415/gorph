import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
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

  const generateYamlFromDescription = async (description: string, isRefinement: boolean = false) => {
    setIsGenerating(true);
    
    try {
      const prompt = createGorphPrompt(description, isRefinement ? conversationHistory : []);
      
      // TODO: Replace with actual API integration
      const response = await callLLMAPI(prompt);
      
      if (response.yaml) {
        setGeneratedYaml(response.yaml);
        
        // Add to conversation history
        const newHistory = [
          ...conversationHistory,
          { role: 'user' as const, content: description },
          { role: 'assistant' as const, content: response.yaml }
        ];
        setConversationHistory(newHistory);
        
        // Validate the generated YAML
        await validateGeneratedYaml(response.yaml);
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
          yaml: `entities:
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
    type: Service_Call`
        };
      }
      
      return {
        yaml: `entities:
  - id: UserDescription
    category: USER_FACING
    description: "Generated from: ${prompt.substring(0, 100)}..."
    status: healthy
    owner: ai-generated
    environment: production

connections: []`
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
      onYamlGenerated(generatedYaml);
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
      <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 20 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
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
          <Text style={{ color: '#1e293b', fontSize: 24, fontWeight: 'bold' }}>
            🤖 AI YAML Generator
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => setShowAPIConfig(true)} 
              style={{ 
                padding: 8, 
                marginRight: 8,
                backgroundColor: '#f3f4f6',
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#d1d5db'
              }}
            >
              <Text style={{ color: '#6b7280', fontSize: 14 }}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
              <Text style={{ color: '#ef4444', fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* API Status Section */}
          {hasAPIKey && (
            <View style={{
              backgroundColor: '#ffffff',
              padding: 15,
              borderRadius: 8,
              marginBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#10b981', fontSize: 14, fontWeight: 'bold', marginBottom: 2 }}>
                    ✅ AI Provider Configured
                  </Text>
                  <Text style={{ color: '#6b7280', fontSize: 12 }}>
                    {getCurrentProviderName()} • Ready to generate
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowAPIConfig(true)}
                  style={{
                    backgroundColor: '#f3f4f6',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: '#d1d5db'
                  }}
                >
                  <Text style={{ color: '#374151', fontSize: 12, fontWeight: '600' }}>
                    Change Provider
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* API Configuration Warning */}
          {!hasAPIKey && (
            <View style={{
              backgroundColor: '#fef3c7',
              padding: 15,
              borderRadius: 8,
              marginBottom: 20,
              borderLeftWidth: 4,
              borderLeftColor: '#f59e0b',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
              <Text style={{ color: '#92400e', fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>
                🔐 API Key Required
              </Text>
              <Text style={{ color: '#b45309', fontSize: 14, marginBottom: 10 }}>
                To use AI generation, you need to configure an API key from OpenAI, Anthropic, or Google Gemini.
              </Text>
              <TouchableOpacity
                onPress={() => setShowAPIConfig(true)}
                style={{
                  backgroundColor: '#1e293b',
                  padding: 12,
                  borderRadius: 6,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>
                  ⚙️ Configure API Key
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Examples Section */}
          {showExamples && hasAPIKey && (
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
              <Text style={{ color: '#1e293b', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
                💡 Try These Examples:
              </Text>
              {EXAMPLES.map((example, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleExampleClick(example)}
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: 15,
                    borderRadius: 8,
                    marginBottom: 10,
                    borderLeftWidth: 4,
                    borderLeftColor: '#10b981'
                  }}
                >
                  <Text style={{ color: '#059669', fontSize: 16, fontWeight: 'bold' }}>
                    {example.title}
                  </Text>
                  <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 5 }}>
                    {example.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Input Section */}
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
            <Text style={{ color: '#1e293b', fontSize: 16, marginBottom: 10, fontWeight: '600' }}>
              📝 Describe Your System:
            </Text>
            <TextInput
              value={userInput}
              onChangeText={setUserInput}
              placeholder="e.g., Design a graph of a car engine operation..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: '#f8fafc',
                color: '#1e293b',
                padding: 15,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#e5e7eb',
                fontSize: 16,
                textAlignVertical: 'top'
              }}
            />
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={!userInput.trim() || isGenerating || !hasAPIKey}
              style={{
                flex: 1,
                backgroundColor: userInput.trim() && !isGenerating && hasAPIKey ? '#10b981' : '#d1d5db',
                padding: 15,
                borderRadius: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                {isGenerating ? '🤖 Generating...' : !hasAPIKey ? '🔐 Configure API First' : '✨ Generate YAML'}
              </Text>
            </TouchableOpacity>

            {conversationHistory.length > 0 && (
              <TouchableOpacity
                onPress={handleRefine}
                disabled={!userInput.trim() || isGenerating}
                style={{
                  flex: 1,
                  backgroundColor: '#f59e0b',
                  padding: 15,
                  borderRadius: 8,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                  🔄 Refine
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleClear}
              style={{
                backgroundColor: '#ef4444',
                padding: 15,
                borderRadius: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                🗑️ Clear
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={{ color: '#1e293b', fontSize: 16, fontWeight: 'bold' }}>
                  📄 Generated YAML:
                </Text>
                <TouchableOpacity
                  onPress={handleUseYaml}
                  style={{
                    backgroundColor: '#10b981',
                    padding: 10,
                    borderRadius: 6
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>
                    ✅ Use This YAML
                  </Text>
                </TouchableOpacity>
              </View>
              
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
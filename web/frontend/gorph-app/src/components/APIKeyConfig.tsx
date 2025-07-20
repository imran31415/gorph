import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, ScrollView } from 'react-native';

interface APIKeyConfigProps {
  visible: boolean;
  onClose: () => void;
}

interface APIKeySettings {
  provider: 'openai' | 'anthropic' | 'gemini' | '';
  apiKey: string;
  model?: string;
}

export const APIKeyConfig: React.FC<APIKeyConfigProps> = ({ visible, onClose }) => {
  const [settings, setSettings] = useState<APIKeySettings>({
    provider: '',
    apiKey: '',
    model: ''
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    try {
      // Try to load from localStorage (web) or AsyncStorage (mobile)
      const openaiKey = localStorage?.getItem('openai_api_key') || '';
      const anthropicKey = localStorage?.getItem('anthropic_api_key') || '';
      const geminiKey = localStorage?.getItem('gemini_api_key') || '';

      let provider: 'openai' | 'anthropic' | 'gemini' | '' = '';
      let apiKey = '';

      if (openaiKey) {
        provider = 'openai';
        apiKey = openaiKey;
      } else if (anthropicKey) {
        provider = 'anthropic';
        apiKey = anthropicKey;
      } else if (geminiKey) {
        provider = 'gemini';
        apiKey = geminiKey;
      }

      setSettings({
        provider,
        apiKey,
        model: localStorage?.getItem(`${provider}_model`) || ''
      });
    } catch (error) {
      console.log('Failed to load API settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      if (!settings.provider || !settings.apiKey) {
        setTestResult({ success: false, message: 'Please select a provider and enter an API key' });
        return;
      }

      // Clear other provider keys first
      localStorage?.removeItem('openai_api_key');
      localStorage?.removeItem('anthropic_api_key');
      localStorage?.removeItem('gemini_api_key');

      // Save the selected provider's key
      localStorage?.setItem(`${settings.provider}_api_key`, settings.apiKey);
      
      if (settings.model) {
        localStorage?.setItem(`${settings.provider}_model`, settings.model);
      }

      setTestResult({ success: true, message: 'API key saved successfully!' });
      
      // Close after a brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to save API key' });
    }
  };

  const clearAllSettings = async () => {
    try {
      // Clear all API keys and models
      localStorage?.removeItem('openai_api_key');
      localStorage?.removeItem('anthropic_api_key');
      localStorage?.removeItem('gemini_api_key');
      localStorage?.removeItem('openai_model');
      localStorage?.removeItem('anthropic_model');
      localStorage?.removeItem('gemini_model');

      // Reset form
      setSettings({
        provider: '',
        apiKey: '',
        model: ''
      });

      setTestResult({ success: true, message: 'All API settings cleared successfully!' });
      
      // Close after a brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to clear settings' });
    }
  };

  const testConnection = async () => {
    if (!settings.provider || !settings.apiKey) {
      setTestResult({ success: false, message: 'Please configure API key first' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const { LLMService } = await import('../services/llmService');
      const service = new LLMService({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model || undefined
      });

      // Test with a simple prompt
      await service.generateYAML('Create a simple test entity with id TestEntity, category BACKEND, description "Test", status healthy, owner test-team, environment production');
      
      setTestResult({ success: true, message: 'Connection successful! ✅' });
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `Connection failed: ${error.message}` 
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getProviderInfo = (provider: string) => {
    switch (provider) {
      case 'openai':
        return {
          name: 'OpenAI',
          description: 'GPT-4o, GPT-4o-mini models',
          defaultModel: 'gpt-4o-mini',
          keyUrl: 'https://platform.openai.com/api-keys'
        };
      case 'anthropic':
        return {
          name: 'Anthropic',
          description: 'Claude 3 models',
          defaultModel: 'claude-3-haiku-20240307',
          keyUrl: 'https://console.anthropic.com/settings/keys'
        };
      case 'gemini':
        return {
          name: 'Google Gemini',
          description: 'Gemini 1.5 Flash, Pro models',
          defaultModel: 'gemini-1.5-flash',
          keyUrl: 'https://aistudio.google.com/app/apikey'
        };
      default:
        return null;
    }
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
            {settings.provider ? '⚙️ Manage AI Settings' : '🔐 Configure AI API'}
          </Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
            <Text style={{ color: '#ef4444', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }}>
          {/* Provider Selection */}
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
            <Text style={{ color: '#1e293b', fontSize: 16, marginBottom: 10, fontWeight: 'bold' }}>
              Choose AI Provider:
            </Text>
            
            {['openai', 'anthropic', 'gemini'].map((provider) => {
              const info = getProviderInfo(provider);
              return (
                <TouchableOpacity
                  key={provider}
                  onPress={() => setSettings(prev => ({ 
                    ...prev, 
                    provider: provider as any,
                    model: info?.defaultModel || ''
                  }))}
                  style={{
                    backgroundColor: settings.provider === provider ? '#dbeafe' : '#f8fafc',
                    padding: 15,
                    borderRadius: 8,
                    marginBottom: 10,
                    borderWidth: 2,
                    borderColor: settings.provider === provider ? '#3b82f6' : '#e5e7eb'
                  }}
                >
                  <Text style={{ 
                    color: settings.provider === provider ? '#1e40af' : '#1e293b', 
                    fontSize: 16, 
                    fontWeight: 'bold',
                    marginBottom: 5 
                  }}>
                    {info?.name}
                  </Text>
                  <Text style={{ color: '#6b7280', fontSize: 14 }}>
                    {info?.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* API Key Input */}
          {settings.provider && (
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
              <Text style={{ color: '#1e293b', fontSize: 16, marginBottom: 10, fontWeight: 'bold' }}>
                API Key:
              </Text>
              <TextInput
                value={settings.apiKey}
                onChangeText={(text) => setSettings(prev => ({ ...prev, apiKey: text }))}
                placeholder={`Enter your ${getProviderInfo(settings.provider)?.name} API key`}
                placeholderTextColor="#9ca3af"
                secureTextEntry
                style={{
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  padding: 15,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  fontSize: 16,
                  fontFamily: 'monospace'
                }}
              />
              
              <TouchableOpacity
                onPress={() => {
                  const info = getProviderInfo(settings.provider);
                  if (info?.keyUrl) {
                    // On web, open in new tab. On mobile, we'd need Linking
                    window?.open(info.keyUrl, '_blank');
                  }
                }}
                style={{ marginTop: 10 }}
              >
                <Text style={{ color: '#3b82f6', fontSize: 14, textDecorationLine: 'underline' }}>
                  Get your API key from {getProviderInfo(settings.provider)?.name} →
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Model Selection (Optional) */}
          {settings.provider && (
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
              <Text style={{ color: '#1e293b', fontSize: 16, marginBottom: 10, fontWeight: 'bold' }}>
                Model (Optional):
              </Text>
              <TextInput
                value={settings.model}
                onChangeText={(text) => setSettings(prev => ({ ...prev, model: text }))}
                placeholder={`Default: ${getProviderInfo(settings.provider)?.defaultModel}`}
                placeholderTextColor="#9ca3af"
                style={{
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  padding: 15,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  fontSize: 16,
                  fontFamily: 'monospace'
                }}
              />
            </View>
          )}

          {/* Test Result */}
          {testResult && (
            <View style={{
              backgroundColor: testResult.success ? '#d1fae5' : '#fee2e2',
              borderColor: testResult.success ? '#10b981' : '#ef4444',
              borderWidth: 1,
              padding: 15,
              borderRadius: 8,
              marginBottom: 20
            }}>
              <Text style={{ color: testResult.success ? '#065f46' : '#7f1d1d', fontSize: 16 }}>
                {testResult.message}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              onPress={testConnection}
              disabled={!settings.provider || !settings.apiKey || isTesting}
              style={{
                flex: 1,
                backgroundColor: settings.provider && settings.apiKey && !isTesting ? '#f59e0b' : '#d1d5db',
                padding: 15,
                borderRadius: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                {isTesting ? '🧪 Testing...' : '🧪 Test Connection'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={saveSettings}
              disabled={!settings.provider || !settings.apiKey}
              style={{
                flex: 1,
                backgroundColor: settings.provider && settings.apiKey ? '#10b981' : '#d1d5db',
                padding: 15,
                borderRadius: 8,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: 'bold' }}>
                💾 Save & Close
              </Text>
            </TouchableOpacity>
          </View>

          {/* Clear Settings Button */}
          {(settings.provider || settings.apiKey) && (
            <TouchableOpacity
              onPress={clearAllSettings}
              style={{
                backgroundColor: '#fee2e2',
                borderColor: '#ef4444',
                borderWidth: 1,
                padding: 15,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 20
              }}
            >
              <Text style={{ color: '#dc2626', fontSize: 16, fontWeight: 'bold' }}>
                🗑️ Clear All API Settings
              </Text>
            </TouchableOpacity>
          )}

          {/* Information */}
          <View style={{ 
            backgroundColor: '#ffffff', 
            padding: 15, 
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}>
            <Text style={{ color: '#1e40af', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
              ℹ️ Privacy & Security
            </Text>
            <Text style={{ color: '#6b7280', fontSize: 14, lineHeight: 20 }}>
              • API keys are stored locally on your device{'\n'}
              • No keys are sent to Gorph servers{'\n'}
              • Direct communication with your chosen AI provider{'\n'}
              • You can delete keys anytime from browser storage
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

export default APIKeyConfig; 
export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'gemini';
  apiKey: string;
  model?: string;
}

export interface LLMResponse {
  yaml: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
  gemini: 'gemini-1.5-flash'
};

export class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async generateYAML(prompt: string): Promise<LLMResponse> {
    try {
      switch (this.config.provider) {
        case 'openai':
          return await this.callOpenAI(prompt);
        case 'anthropic':
          return await this.callAnthropic(prompt);
        case 'gemini':
          return await this.callGemini(prompt);
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('LLM API Error:', error);
      throw new Error(`Failed to generate YAML: ${error.message}`);
    }
  }

  private async callOpenAI(prompt: string): Promise<LLMResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model || DEFAULT_MODELS.openai,
        messages: [
          {
            role: 'system',
            content: 'You are a specialist in converting natural language descriptions into valid YAML infrastructure diagrams. Always respond with only valid YAML, no explanations or markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const yaml = data.choices[0]?.message?.content?.trim();
    
    if (!yaml) {
      throw new Error('No YAML content received from OpenAI');
    }

    return {
      yaml,
      usage: data.usage
    };
  }

  private async callAnthropic(prompt: string): Promise<LLMResponse> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model || DEFAULT_MODELS.anthropic,
        max_tokens: 2000,
        temperature: 0.3,
        system: 'You are a specialist in converting natural language descriptions into valid YAML infrastructure diagrams. Always respond with only valid YAML, no explanations or markdown formatting.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const yaml = data.content[0]?.text?.trim();
    
    if (!yaml) {
      throw new Error('No YAML content received from Anthropic');
    }

    return {
      yaml,
      usage: data.usage
    };
  }

  private async callGemini(prompt: string): Promise<LLMResponse> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model || DEFAULT_MODELS.gemini}:generateContent?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a specialist in converting natural language descriptions into valid YAML infrastructure diagrams. Always respond with only valid YAML, no explanations or markdown formatting.\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const yaml = data.candidates[0]?.content?.parts[0]?.text?.trim();
    
    if (!yaml) {
      throw new Error('No YAML content received from Gemini');
    }

    return {
      yaml,
      usage: data.usageMetadata
    };
  }
}

// Environment-based configuration
export const createLLMService = (): LLMService | null => {
  // Try to get API key from environment or localStorage
  const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY || localStorage?.getItem('openai_api_key');
  const anthropicKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || localStorage?.getItem('anthropic_api_key');
  const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || localStorage?.getItem('gemini_api_key');

  if (openaiKey) {
    return new LLMService({ provider: 'openai', apiKey: openaiKey });
  } else if (anthropicKey) {
    return new LLMService({ provider: 'anthropic', apiKey: anthropicKey });
  } else if (geminiKey) {
    return new LLMService({ provider: 'gemini', apiKey: geminiKey });
  }

  return null;
};

// Gorph-specific prompt templates
export const createGorphPrompt = (userDescription: string, conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = []) => {
  const categoryList = [
    'USER_FACING', 'FRONTEND', 'BACKEND', 'DATABASE', 'NETWORK', 
    'INTEGRATION', 'INFRASTRUCTURE', 'INTERNAL', 'CI', 'REGISTRY', 
    'CONFIG', 'CD', 'ENVIRONMENT', 'SCM'
  ];

  const connectionTypes = [
    'HTTP_Request', 'API_Call', 'Internal_API', 'DB_Connection', 
    'Service_Call', 'User_Interaction', 'Triggers_Build', 'Pushes_Image', 
    'Updates_Config', 'Watches_Config', 'Deploys_To', 'Deploys', 'Hosts'
  ];

  const historyContext = conversationHistory.length > 0 
    ? `\n\nPREVIOUS CONVERSATION:\n${conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n')}\n`
    : '';

  return `You are a specialist in converting natural language descriptions into Gorph YAML infrastructure diagrams.

GORPH YAML SCHEMA REQUIREMENTS:

ENTITIES (Required fields for each entity):
- id: unique identifier (use underscores instead of spaces, no special characters except underscore)
- category: MUST be one of: ${categoryList.join(', ')}
- description: human-readable description (wrap in quotes)
- status: one of: healthy, degraded, down, unknown
- owner: team/person responsible (e.g., "backend-team", "ops")
- environment: one of: production, staging, development
- attributes: (optional) key-value pairs for metadata
- tags: (optional) array of strings

CONNECTIONS (Required fields for each connection):
- from: source entity id (must match an entity id exactly)
- to: target entity id (must match an entity id exactly)  
- type: MUST be one of: ${connectionTypes.join(', ')}

CATEGORY MAPPING GUIDELINES:
- Physical/mechanical components → INFRASTRUCTURE
- Control systems, processors, engines → BACKEND
- Input/output interfaces, pipes, networks → NETWORK
- Storage systems, tanks, repositories → DATABASE
- User touchpoints, displays, interfaces → USER_FACING
- External services, third-party systems → INTEGRATION
- Internal tools, monitoring → INTERNAL

CONNECTION TYPE GUIDELINES:
- Data/signal flow → Service_Call
- User interactions → User_Interaction
- Database access → DB_Connection
- External API calls → API_Call
- HTTP requests → HTTP_Request
- Mechanical/physical connections → Service_Call
- Triggering processes → Triggers_Build

YAML FORMAT EXAMPLE:
\`\`\`yaml
entities:
  - id: ComponentName
    category: BACKEND
    description: "Component description"
    status: healthy
    owner: team-name
    environment: production
    attributes:
      key: value

connections:
  - from: SourceComponent
    to: TargetComponent
    type: Service_Call
\`\`\`

${historyContext}

USER REQUEST: "${userDescription}"

IMPORTANT: 
1. Generate ONLY valid YAML (no explanations, no markdown formatting)
2. Ensure all entity IDs are unique and properly referenced in connections
3. Use appropriate categories and connection types from the lists above
4. Make sure the diagram logically represents the described system
5. Include key components and their relationships

YAML:`;
};

export default LLMService; 
import { LLMSettings, LLMModel } from '../types';

export async function getAvailableModels(settings: LLMSettings): Promise<LLMModel[]> {
  const provider = settings.selectedProvider;
  const config = settings[provider];

  if (!config.apiKey) return [];

  try {
    if (provider === 'google') {
      // Fetch models from Google GenAI API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.apiKey}`);
      
      if (!response.ok) {
         const err = await response.text();
         console.error("Google Model Fetch Error:", err);
         throw new Error(`Google API Error: ${response.status}`);
      }

      const data = await response.json();
      
      const models = (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => ({
          id: m.name.replace('models/', ''),
          name: m.displayName || m.name
        }))
        .sort((a: LLMModel, b: LLMModel) => a.name.localeCompare(b.name));
        
      if (models.length === 0) throw new Error("No models found");
      return models;
    } 
    
    if (provider === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${config.apiKey}` }
      });
      
      if (!response.ok) {
         throw new Error(`Groq API Error: ${response.status}`);
      }

      const data = await response.json();

      return (data.data || [])
        .map((m: any) => ({
            id: m.id,
            name: m.id
        }))
        .sort((a: LLMModel, b: LLMModel) => a.id.localeCompare(b.id));
    }

    if (provider === 'openai') {
        const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
        const response = await fetch(`${baseUrl}/models`, {
            headers: { 'Authorization': `Bearer ${config.apiKey}` }
        });
        
        if (!response.ok) {
             throw new Error(`OpenAI API Error: ${response.status}`);
        }

        const data = await response.json();

        return (data.data || [])
            .filter((m: any) => m.id.toLowerCase().includes('gpt') || m.id.toLowerCase().includes('o1')) 
            .map((m: any) => ({
                id: m.id,
                name: m.id
            }))
            .sort((a: LLMModel, b: LLMModel) => a.id.localeCompare(b.id));
    }

    return [];
  } catch (error) {
    console.error("Failed to fetch models, utilizing fallbacks", error);
    
    // Robust Fallbacks based on latest guidelines
    if (provider === 'google') return [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
        { id: 'gemini-2.5-flash-lite-latest', name: 'Gemini 2.5 Flash Lite' },
        { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
    ];
    if (provider === 'groq') return [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70b (Default)' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7b' },
        { id: 'gemma2-9b-it', name: 'Gemma 2 9b' },
        { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70b' }
    ];
    
    return [];
  }
}
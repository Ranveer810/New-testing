import { z } from 'zod';
import { Message as VercelMessage } from 'ai';

// Re-exporting Vercel types for consistency
export type Message = VercelMessage;

export interface WebProject {
  html: string;
  css: string;
  javascript: string;
}

export interface ConsoleLog {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: number;
}

export interface PreviewState {
  project: WebProject | null;
  version: number;
  status: 'idle' | 'generating' | 'ready' | 'error';
}

// --- LLM Settings Types ---

export type LLMProvider = 'google' | 'groq' | 'openai';

export interface LLMModel {
  id: string;
  name: string;
}

export interface ProviderConfig {
    apiKey: string;
    model: string;
    baseUrl?: string; 
}

export interface LLMSettings {
  selectedProvider: LLMProvider;
  google: ProviderConfig;
  groq: ProviderConfig;
  openai: ProviderConfig;
}

export const DEFAULT_SETTINGS: LLMSettings = {
    selectedProvider: 'google',
    google: {
        apiKey: '',
        model: 'gemini-2.5-flash'
    },
    groq: {
        apiKey: '',
        model: 'llama-3.3-70b-versatile'
    },
    openai: {
        apiKey: '',
        model: 'gpt-4-turbo',
        baseUrl: 'https://api.openai.com/v1'
    }
};

export interface ToolInvocation {
    state: 'partial-call' | 'call' | 'result';
    toolCallId: string;
    toolName: string;
    args: any;
    result?: any;
}
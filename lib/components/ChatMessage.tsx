"use client";

import React from 'react';
import { Message } from 'ai';
import { cn } from '../lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { 
    Tool, 
    ToolHeader, 
    ToolContent, 
    ToolInput, 
    ToolOutput 
} from './ui/ToolUI';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isTool = message.role === 'tool'; // Vercel stores tool results as separate messages sometimes, or inside toolInvocations

  // If it's a standalone tool result message (old pattern), skip or render differently.
  // Vercel AI SDK 3.0+ attaches toolInvocations to the assistant message usually.
  if (message.role === 'system' || message.role === 'data') return null;

  // Render Text Bubble
  const renderText = (text: string) => {
      if (!text) return null;
      return (
        <div className={cn(
            "rounded-lg px-4 py-3 text-sm shadow-sm overflow-hidden w-fit max-w-full animate-in fade-in slide-in-from-bottom-1",
            isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-card border border-border text-card-foreground"
        )}>
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-white/10 break-words">
                <ReactMarkdown 
                    components={{
                        code({node, inline, className, children, ...props}: any) {
                            return !inline ? (
                                <code className="block bg-black/30 p-2 rounded text-xs font-mono whitespace-pre-wrap overflow-x-auto" {...props}>
                                    {children}
                                </code>
                            ) : (
                                <code className="bg-black/30 rounded px-1 py-0.5 text-xs font-mono break-all" {...props}>
                                    {children}
                                </code>
                            )
                        }
                    }}
                >
                    {text}
                </ReactMarkdown>
            </div>
        </div>
      );
  };

  // Render Tools attached to this message
  const renderTools = () => {
      if (!message.toolInvocations) return null;

      return message.toolInvocations.map((toolInvocation) => {
          const { toolCallId, toolName, args, state } = toolInvocation;
          let result = undefined;
          
          // If the state is 'result', the result is inside the invocation object
          if (state === 'result') {
             result = toolInvocation.result;
          }

          return (
            <div key={toolCallId} className="w-full max-w-[500px] animate-in zoom-in-95 duration-300">
                <Tool defaultOpen={false}>
                    <ToolHeader 
                        toolName={toolName} 
                        // Map Vercel state to our UI state
                        state={state === 'result' ? 'output-available' : 'input-available'} 
                    />
                    <ToolContent>
                        <ToolInput input={args} />
                        <ToolOutput 
                            output={result} 
                            errorText={result?.status === 'error' ? result.message : undefined} 
                        />
                    </ToolContent>
                </Tool>
            </div>
          );
      });
  };

  return (
    <div className={cn(
      "flex w-full gap-3 p-4 transition-all",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={cn(
        "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm mt-1",
        isUser ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-foreground"
      )}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className={cn(
        "flex max-w-[85%] flex-col gap-2",
        isUser ? "items-end" : "items-start"
      )}>
         {/* Content comes first, then tools usually */}
         {renderText(message.content)}
         {renderTools()}
      </div>
    </div>
  );
};

import { useCallback } from 'react';
import { useChat } from 'ai/react';
import { LLMSettings, ConsoleLog } from '../types';
import { useProject } from './use-project';
import * as runtime from '../lib/runtime-tools';
import { toast } from 'sonner';

export function useAgent(
  projectManager: ReturnType<typeof useProject>, 
  settings: LLMSettings,
  consoleLogs: ConsoleLog[]
) {
  const { projectRef, updateFile, patchFile, DEFAULT_PROJECT } = projectManager;

  // The Vercel AI SDK useChat hook handles state, streaming, and tool calls
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit: originalHandleSubmit, 
    stop, 
    isLoading, 
    addToolResult 
  } = useChat({
    api: '/api/chat',
    maxSteps: 5, // Allow up to 5 round trips for tools (e.g. read -> update -> read)
    body: {
        settings // Pass dynamic settings (keys) to server
    },
    async onToolCall({ toolCall }) {
        const { name, args } = toolCall;
        const currentProj = projectRef.current || DEFAULT_PROJECT;
        
        console.log(`[Agent] Executing client tool: ${name}`, args);

        try {
            switch (name) {
                case 'read_files':
                    return {
                        status: "success",
                        files: currentProj
                    };

                case 'update_file':
                    const updateResult = updateFile(args.target, args.content);
                    if (updateResult.success) {
                        toast.success(`Updated ${args.target}`);
                        return { status: "success", message: `Updated ${args.target}` };
                    } else {
                        toast.error(`Failed to update ${args.target}`);
                        return { status: "error", message: updateResult.message };
                    }

                case 'patch_file':
                    const patchResult = patchFile(args.target, args.search_string, args.replacement_string);
                    if (patchResult.success) {
                        toast.success(`Patched ${args.target}`);
                        return { status: "success", message: `Patched ${args.target}` };
                    } else {
                        toast.error(`Failed to patch ${args.target}`);
                        return { status: "error", message: patchResult.message };
                    }

                case 'screenshot_website':
                    toast.info("Taking screenshot...");
                    const shot = await runtime.takeScreenshot(currentProj);
                    return shot;

                case 'validate_functionality':
                    toast.info("Running tests...");
                    const testResult = await runtime.runProjectTest(currentProj, args.test_script);
                    if (testResult.status === 'success') {
                        toast.success("Test Passed");
                    } else {
                        toast.error("Test Failed");
                    }
                    return testResult;

                case 'read_console_logs':
                    return {
                        status: "success",
                        logs: consoleLogs.map(l => `[${l.type.toUpperCase()}] ${l.message}`).join('\n') || "No console logs."
                    };

                default:
                    return { status: "error", message: "Unknown tool" };
            }
        } catch (e: any) {
            console.error("Tool Execution Error", e);
            toast.error(`Error executing ${name}`);
            return { status: "error", message: e.message };
        }
    },
  });

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    stopGeneration: stop,
    isLoading
  };
}
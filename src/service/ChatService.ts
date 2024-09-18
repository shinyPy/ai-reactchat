import { modelDetails, OpenAIModel } from "../models/model";
import { ChatCompletionMessage, ChatCompletionRequest, ChatMessage, ChatMessagePart } from "../models/ChatCompletion";
import { OPENAI_API_KEY } from "../config";
import { CustomError } from "./CustomError";
import { CHAT_COMPLETIONS_ENDPOINT, MODELS_ENDPOINT } from "../constants/apiEndpoints";
import { ChatSettings } from "../models/ChatSettings";
import { CHAT_STREAM_DEBOUNCE_TIME, DEFAULT_MODEL } from "../constants/appConstants";
import { NotificationService } from '../service/NotificationService';
import { FileDataRef } from "../models/FileData";

export class ChatService {
  private static models: Promise<OpenAIModel[]> | null = null;
  private static abortController: AbortController | null = null;

  static async mapChatMessagesToCompletionMessages(apiKey: string, modelId: string, messages: ChatMessage[]): Promise<ChatCompletionMessage[]> {
    const model = await this.getModelById(apiKey, modelId);
    if (!model) {
      throw new Error(`Model with ID '${modelId}' not found`);
    }

    return messages.map((message) => {
      const contentParts: ChatMessagePart[] = [{ type: 'text', text: message.content }];

      if (model.image_support && message.fileDataRef) {
        message.fileDataRef.forEach((fileRef) => {
          const fileUrl = fileRef.fileData?.data;
          if (fileUrl) {
            const fileType = fileRef.fileData!.type.startsWith('image') ? 'image_url' : fileRef.fileData!.type;
            contentParts.push({
              type: fileType,
              image_url: { url: fileUrl }
            });
          }
        });
      }
      return { role: message.role, content: contentParts };
    });
  }

  static debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  static async sendMessageStreamed(
    apiKey: string,
    chatSettings: ChatSettings,
    messages: ChatMessage[],
    callback: (content: string, fileDataRef: FileDataRef[]) => void
  ): Promise<void> {
    this.abortController = new AbortController();

    const requestBody: ChatCompletionRequest = {
      model: chatSettings.model ?? DEFAULT_MODEL,
      messages: await this.mapChatMessagesToCompletionMessages(apiKey, chatSettings.model ?? DEFAULT_MODEL, messages),
      stream: true,
      temperature: chatSettings.temperature,
      top_p: chatSettings.top_p,
      seed: chatSettings.seed,
    };

    try {
      const response = await fetch(CHAT_COMPLETIONS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        const err = await response.json();
        throw new CustomError(err.error.message, err);
      }

      if (!response.body) throw new Error('Response body is null');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) callback(content, []);
            } catch (error) {
              console.error('Error parsing JSON:', error);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Stream aborted');
        } else {
          throw error;
        }
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  }

  static cancelStream(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  static async getModels(apiKey: string): Promise<OpenAIModel[]> {
    return this.fetchModels(apiKey);
  }

  static async getModelById(apiKey: string, modelId: string): Promise<OpenAIModel | null> {
    try {
      const models = await this.getModels(apiKey);
      const foundModel = models.find(model => model.id === modelId);
      if (!foundModel) {
        throw new CustomError(`Model with ID '${modelId}' not found.`, {
          code: 'MODEL_NOT_FOUND',
          status: 404
        });
      }
      return foundModel;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Failed to get models:', error.message);
        throw new CustomError('Error retrieving models.', {
          code: 'FETCH_MODELS_FAILED',
          status: (error as any).status || 500
        });
      }
      console.error('Unexpected error type:', error);
      throw new CustomError('Unknown error occurred.', {
        code: 'UNKNOWN_ERROR',
        status: 500
      });
    }
  }

  static async fetchModels(apiKey: string): Promise<OpenAIModel[]> {
    if (this.models !== null) {
      return this.models;
    }

    try {
      const response = await fetch(MODELS_ENDPOINT, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error.message);
      }

      const data = await response.json();
      const models: OpenAIModel[] = data.data
        .filter((model: OpenAIModel) => model.id.startsWith("gpt-"))
        .map((model: OpenAIModel) => {
          const details = modelDetails[model.id] || {
            contextWindowSize: 0,
            knowledgeCutoffDate: '',
            imageSupport: false,
            preferred: false,
            deprecated: false,
          };
          return {
            ...model,
            context_window: details.contextWindowSize,
            knowledge_cutoff: details.knowledgeCutoffDate,
            image_support: details.imageSupport,
            preferred: details.preferred,
            deprecated: details.deprecated,
          };
        })
        .sort((a: OpenAIModel, b: OpenAIModel) => b.id.localeCompare(a.id));

      this.models = Promise.resolve(models);
      return models;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  }
}
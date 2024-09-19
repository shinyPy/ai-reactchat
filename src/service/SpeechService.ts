import { OpenAIModel } from "../models/model";
import { CustomError } from "./CustomError";
import { SpeechSettings } from "../models/SpeechSettings"; // Adjust the path as necessary

export class SpeechService {
  private static models: Promise<OpenAIModel[]> | null = null;

  static async textToSpeech(
    apiKey: string,
    text: string,
    settings: SpeechSettings,
    openaiEndpoint: string
  ): Promise<string> {
    const TTS_ENDPOINT = `${openaiEndpoint}/v1/audio/speech`;
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };

    if (text.length > 4096) {
      throw new Error("Input text exceeds the maximum length of 4096 characters.");
    }

    if (settings.speed < 0.25 || settings.speed > 4.0) {
      throw new Error("Speed must be between 0.25 and 4.0.");
    }

    const requestBody = {
      model: settings.id,
      voice: settings.voice,
      input: text,
      speed: settings.speed,
      response_format: "mp3",
    };

    try {
      const response = await fetch(TTS_ENDPOINT, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new CustomError(err.error.message, err);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (err: any) {
      if (err.message.includes('Failed to fetch')) {
        throw new CustomError('Invalid endpoint or network error', {
          code: 'INVALID_ENDPOINT',
          status: 400
        });
      }
      throw new Error(err.message || err);
    }
  }

  static getModels = (apiKey: string, openaiEndpoint: string): Promise<OpenAIModel[]> => {
    return SpeechService.fetchModels(apiKey, openaiEndpoint);
  };

  static async fetchModels(apiKey: string, openaiEndpoint: string): Promise<OpenAIModel[]> {
    if (this.models !== null) {
      return this.models;
    }

    const MODELS_ENDPOINT = `${openaiEndpoint}/v1/models`;

    try {
      const response = await fetch(MODELS_ENDPOINT, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error.message);
      }

      const data = await response.json();
      const models: OpenAIModel[] = data.data.filter((model: OpenAIModel) => model.id.includes("tts"));
      this.models = Promise.resolve(models);
      return models;
    } catch (err: any) {
      if (err.message.includes('Failed to fetch')) {
        throw new CustomError('Invalid endpoint or network error', {
          code: 'INVALID_ENDPOINT',
          status: 400
        });
      }
      throw new Error(err.message || err);
    }
  }
}

import React, { createContext, ReactNode, useEffect, useState } from 'react';

export type UserTheme = 'light' | 'dark' | 'system';
export type Theme = 'light' | 'dark';

interface UserSettings {
  userTheme: UserTheme;
  theme: Theme;
  model: string | null;
  instructions: string;
  speechModel: string | null;
  speechVoice: string | null;
  speechSpeed: number | null;
  apiKey: string | null;
  openaiEndpoint: string;
}

const defaultUserSettings: UserSettings = {
  userTheme: 'system',
  theme: 'light',
  model: null,
  instructions: '',
  speechModel: 'tts-1',
  speechVoice: 'echo',
  speechSpeed: 1.0,
  apiKey: null,
  openaiEndpoint: 'https://app.oxyapi.uk'
};


const determineEffectiveTheme = (userTheme: UserTheme): Theme => {
  if (userTheme === 'system' || !userTheme) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return userTheme;
};

export const UserContext = createContext<{
  userSettings: UserSettings;
  setUserSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}>({
  userSettings: defaultUserSettings,
  setUserSettings: () => {},
});

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    const storedUserTheme = localStorage.getItem('theme');
    const userTheme: UserTheme = (storedUserTheme === 'light' || storedUserTheme === 'dark' || storedUserTheme === 'system') ? storedUserTheme : defaultUserSettings.userTheme;
    const model = localStorage.getItem('defaultModel') || defaultUserSettings.model;
    const instructions = localStorage.getItem('defaultInstructions') || defaultUserSettings.instructions;
    const speechModel = localStorage.getItem('defaultSpeechModel') || defaultUserSettings.speechModel;
    const speechVoice = localStorage.getItem('defaultSpeechVoice') || defaultUserSettings.speechVoice;
    const speechSpeedRaw = localStorage.getItem('defaultSpeechSpeed');
    const speechSpeed = speechSpeedRaw !== null ? Number(speechSpeedRaw) : defaultUserSettings.speechSpeed;
    const apiKey = localStorage.getItem('apiKey') || defaultUserSettings.apiKey;
    const openaiEndpoint = localStorage.getItem('openaiEndpoint') || defaultUserSettings.openaiEndpoint;
    const effectiveTheme = determineEffectiveTheme(userTheme);
    return {
      userTheme,
      theme: effectiveTheme,
      model,
      instructions,
      speechModel,
      speechVoice,
      speechSpeed,
      apiKey,
      openaiEndpoint
    };
  });

  useEffect(() => {
    localStorage.setItem('theme', userSettings.userTheme);
  }, [userSettings.userTheme]);

  useEffect(() => {
    if (userSettings.model === null || userSettings.model === '') {
      localStorage.removeItem('defaultModel');
    } else {
      localStorage.setItem('defaultModel', userSettings.model);
    }
  }, [userSettings.model]);

  useEffect(() => {
    if (userSettings.instructions === '') {
      localStorage.removeItem('defaultInstructions');
    } else {
      localStorage.setItem('defaultInstructions', userSettings.instructions);
    }
  }, [userSettings.instructions]);

  useEffect(() => {
    const newEffectiveTheme = determineEffectiveTheme(userSettings.userTheme);
    setUserSettings(prevSettings => ({...prevSettings, theme: newEffectiveTheme}));
    if (newEffectiveTheme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [userSettings.userTheme]);

  useEffect(() => {
    if (userSettings.speechModel === null || userSettings.speechModel === '') {
      localStorage.removeItem('defaultSpeechModel');
    } else {
      localStorage.setItem('defaultSpeechModel', userSettings.speechModel);
    }
  }, [userSettings.speechModel]);

  useEffect(() => {
    if (userSettings.speechVoice === null || userSettings.speechVoice === '') {
      localStorage.removeItem('defaultSpeechVoice');
    } else {
      localStorage.setItem('defaultSpeechVoice', userSettings.speechVoice);
    }
  }, [userSettings.speechVoice]);

  useEffect(() => {
    if (userSettings.speechSpeed === null || userSettings.speechSpeed === undefined || userSettings.speechSpeed < 0.25 || userSettings.speechSpeed > 4.0) {
      localStorage.removeItem('defaultSpeechSpeed');
    } else {
      localStorage.setItem('defaultSpeechSpeed', String(userSettings.speechSpeed));
    }
  }, [userSettings.speechSpeed]);

  useEffect(() => {
    if (userSettings.apiKey === null || userSettings.apiKey === '') {
      localStorage.removeItem('apiKey');
    } else {
      localStorage.setItem('apiKey', userSettings.apiKey);
    }
  }, [userSettings.apiKey]);

  useEffect(() => {
    if (userSettings.openaiEndpoint === '') {
      localStorage.removeItem('openaiEndpoint');
    } else {
      localStorage.setItem('openaiEndpoint', userSettings.openaiEndpoint);
    }
  }, [userSettings.openaiEndpoint]);

  return (
    <UserContext.Provider value={{userSettings, setUserSettings}}>
      {children}
    </UserContext.Provider>
  );
};

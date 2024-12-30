/* global SillyTavern */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SettingsProvider } from './ContextManager';
import BotSettings from './BotSettings';
import BotBar from './BotBar';

// const extension_settings = SillyTavern.getContext().extensionSettings;

// Choose the container for the extension's settings UI
const settingsContainer = document.getElementById('extensions_settings2');
const settingsElement = document.createElement('div');
settingsContainer.appendChild(settingsElement);

const chatContainer = document.getElementById('send_form');
const chatElement = document.createElement('div');
chatContainer.appendChild(chatElement);

const settings = ReactDOM.createRoot(settingsElement);
const botBar = ReactDOM.createRoot(chatElement);

settings.render(
    <React.StrictMode>
        <SettingsProvider>
            <BotSettings />
        </SettingsProvider>
    </React.StrictMode>
);

botBar.render(
    <React.StrictMode>
        <SettingsProvider>
            <BotBar />
        </SettingsProvider>
    </React.StrictMode>
);


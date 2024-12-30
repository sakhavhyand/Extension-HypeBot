import React from 'react';
import ReactDOM from 'react-dom';
import { SettingsProvider } from './ContextManager';
import BotSettings from './BotSettings';
import BotBar from './BotBar';

// Choose the container for the extension's settings UI
const settingsContainer = document.getElementById('extensions_settings2');
const chatContainer = document.getElementById('send_form');

function App() {
    return (
        <SettingsProvider>
            {ReactDOM.createPortal(<BotSettings />, settingsContainer)}
            {ReactDOM.createPortal(<BotBar />, chatContainer)}
        </SettingsProvider>
    );
}

const root = ReactDOM.createRoot(document.createElement('div'));
document.body.appendChild(root._internalRoot.containerInfo);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

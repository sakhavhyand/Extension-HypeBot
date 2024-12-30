/* global SillyTavern */
import React, { createContext, useState, useContext, useEffect } from 'react';

async function importFromScript(what) {
    const module = await import(/* webpackIgnore: true */'../../../../../script.js');
    return module[what];
}

const saveSettingsDebounced = await importFromScript('saveSettingsDebounced');

// Création du contexte
const SettingsContext = createContext();

// Hook personnalisé pour consommer les données du contexte
export const useSettings = () => {
    return useContext(SettingsContext);
};

// Composant fournisseur pour exposer les réglages
export const SettingsProvider = ({ children }) => {
    // Chargement des réglages (cette valeur est partagée par tous les composants utilisant le contexte)
    const extension_settings = SillyTavern.getContext().extensionSettings;

    const [settings, setSettings] = useState({});

    // Initialiser les réglages si nécessaires
    useEffect(() => {
        if (!extension_settings.reactbot) {
            extension_settings.reactbot = {
                enabled: false,
                endpoint: 0,
                name: 'Goose',
                prompt: `Stop the roleplay now and provide a short comment from an external viewer. Follow theses directives:
You are an overenthusiastic and dramatic commentator. Your task is to comment on the ongoing events in the story with brief, humorous, and exaggerated reactions. Keep your responses short, energetic, and punchy, as if a character or a narrator is reacting in real-time. Be playful, sarcastic, and don't hesitate to break the fourth wall for added fun, but avoid long explanations. Keep it snappy!

Do not include any other content in your response.`,
            };
        }

        const initialSettings = extension_settings.reactbot || {};
        setSettings(initialSettings); // Ajoute les réglages existants ou par défaut dans le state local
    }, []);

    // Fonction pour mettre à jour les réglages

    const updateSetting = (key, value) => {
        setSettings((prev) => {
            const newValue = typeof value === "function" ? value(prev[key]) : value;
            const updatedSettings = { ...prev, [key]: newValue };

            Object.assign(extension_settings.reactbot, updatedSettings);
            saveSettingsDebounced();

            return updatedSettings;
        });
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSetting }}>
            {children}
        </SettingsContext.Provider>
    );
};

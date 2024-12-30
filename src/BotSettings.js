/* global SillyTavern */
// import React, { useState, useEffect } from 'react';
import { useSettings } from './ContextManager';

// async function importFromScript(what) {
//     const module = await import(/* webpackIgnore: true */'../../../../../script.js');
//     return module[what];
// }

// const saveSettingsDebounced = await importFromScript('saveSettingsDebounced');

function BotSettings() {

//     const extension_settings = SillyTavern.getContext().extensionSettings;
//     const [settings, setSettings] = useState({
//         enabled: false,
//         endpoint: 0,
//         name: 'Goose',
//         prompt: `Stop the roleplay now and provide a short comment from an external viewer. Follow theses directives:
// You are an overenthusiastic and dramatic commentator. Your task is to comment on the ongoing events in the story with brief, humorous, and exaggerated reactions. Keep your responses short, energetic, and punchy, as if a character or a narrator is reacting in real-time. Be playful, sarcastic, and don't hesitate to break the fourth wall for added fun, but avoid long explanations. Keep it snappy!
//
// Do not include any other content in your response.`,
//     });

    const { settings, updateSetting } = useSettings();



    const toggleEnabled = () => updateSetting("enabled", (prev) => !prev);
    const handleInputChange = (e) => updateSetting(e.target.name, e.target.value);
    const handleEndpointChange = (value) => updateSetting("endpoint", parseInt(value));

    // useEffect(() => {
    //     if (!extension_settings.reactbot) {
    //         extension_settings.reactbot = settings;
    //     }
    //     const initialSettings = extension_settings.reactbot || settings;
    //     setSettings(initialSettings);
    // }, []);

    return (
        <div className="reactbot_settings">
            <div className="inline-drawer">
                <div className="inline-drawer-toggle inline-drawer-header">
                    <b>ReactBot</b>
                    <div className="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div className="inline-drawer-content">
                    <div>Show personalized suggestions based on your recent chats.</div>
                    <label className="checkbox_label" htmlFor="reactbot_enabled">
                        <input id="reactbot_enabled"
                               name="reactbot_enabled"
                               type="checkbox"
                               className="checkbox"
                               checked={settings.enabled}
                               onChange={toggleEnabled}
                        />
                        Enabled
                    </label>
                    <div className="radio_group">
                        <label>
                            <input value="0"
                                   name="endpoint_selection"
                                   type="radio"
                                   checked={settings.endpoint === 0}
                                   onChange={() => handleEndpointChange(0)}
                            />
                            <span>NovelAI</span>
                        </label>
                        <label>
                            <input value="1"
                                   name="endpoint_selection"
                                   type="radio"
                                   checked={settings.endpoint === 1}
                                   onChange={() => handleEndpointChange(1)}
                            />
                            <span>Current Endpoint</span>
                        </label>
                    </div>
                    <label htmlFor="reactbot_name">Name:</label>
                    <input id="reactbot_name"
                           type="text"
                           name="name"
                           className="text_pole"
                           placeholder="Goose"
                           value={settings.name}
                           onChange={handleInputChange}
                    />
                    <label htmlFor="reactbot_prompt">Prompt:</label>
                    <textarea id="reactbot_prompt"
                              className="text_pole"
                              name="prompt"
                              placeholder="Prompt"
                              value={settings.prompt}
                              onChange={handleInputChange}
                              disabled={settings.endpoint === 0}
                    ></textarea>
                </div>
            </div>
        </div>
    );
}

export default BotSettings;

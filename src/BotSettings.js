import { useSettings } from './ContextManager';

function BotSettings() {

    const { settings, updateSetting } = useSettings();

    const toggleEnabled = () => updateSetting("enabled", (prev) => !prev);
    const handleInputChange = (e) => updateSetting(e.target.name, e.target.value);
    const handleEndpointChange = (value) => updateSetting("endpoint", parseInt(value));

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

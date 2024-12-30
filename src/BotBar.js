import { useSettings } from './ContextManager';

function BotBar() {

    const { settings, updateSetting } = useSettings();

    return (
        <div
            id="reactBotBar"
            style={{ display: settings.enabled ? "block" : "none" }}
        >
        </div>
    );
}

export default BotBar;

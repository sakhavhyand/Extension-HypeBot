import { eventSource, event_types, is_send_press, saveSettingsDebounced, generateQuietPrompt } from '../../../../script.js';
import { extension_settings, getContext, renderExtensionTemplateAsync } from '../../../extensions.js';
import { debounce } from '../../../utils.js';

const MODULE_NAME = 'third-party/Extension-HypeBot';
const WAITING_VERBS = ['thinking', 'typing', 'brainstorming', 'cooking', 'conjuring', 'reflecting', 'meditating', 'contemplating'];
const EMPTY_VERBS = [
    'is counting the sheep',
    'admires the stars',
    'is waiting patiently',
    'is looking for inspiration',
    'is thinking about the meaning of life',
];
const MAX_PROMPT = 1024;
const MAX_LENGTH = 50;
const MAX_STRING_LENGTH = MAX_PROMPT * 4;
const generateDebounced = debounce(() => generateHypeBot(), 500);
let hypeBotBar, abortController;

const settings = {
    enabled: false,
    name: 'Goose',
    prompt: `Stop the roleplay now and provide a short comment from an external viewer. Follow theses directives:
You are an overenthusiastic and dramatic commentator. Your task is to comment on the ongoing events in the story with brief, humorous, and exaggerated reactions. Keep your responses short, energetic, and punchy—just an only line, full of emotion, as if a character or a narrator is reacting in real-time. Be playful, sarcastic, and don't hesitate to break the fourth wall for added fun, but avoid long explanations. Keep it snappy!

Do not include any other content in your response.`,
};

/**
 * Returns a random waiting verb
 * @returns {string} Random waiting verb
 */
function getWaitingVerb() {
    return WAITING_VERBS[Math.floor(Math.random() * WAITING_VERBS.length)];
}

/**
 * Returns a random verb based on the text
 * @param {string} text Text to generate a verb for
 * @returns {string} Random verb
 */
function getVerb(text) {
    let verbList = ['says', 'notes', 'states', 'whispers', 'murmurs', 'mumbles'];
    if (text.endsWith('!')) {
        verbList = ['proclaims', 'declares', 'salutes', 'exclaims', 'cheers', 'shouts'];
    }
    if (text.endsWith('?')) {
        verbList = ['asks', 'suggests', 'ponders', 'wonders', 'inquires', 'questions'];
    }
    return verbList[Math.floor(Math.random() * verbList.length)];
}

/**
 * Formats the HypeBot reply text
 * @param {string} text HypeBot output text
 * @returns {string} Formatted HTML text
 */
function formatReply(text) {
    return `<span class="hypebot_name">${settings.name} ${getVerb(text)}:</span>&nbsp;<span class="hypebot_text">${text}</span>`;
}

/**
 * Sets the HypeBot text. Preserves scroll position of the chat.
 * @param {string} text Text to set
 */
function setHypeBotText(text) {
    const chatBlock = $('#chat');
    const originalScrollBottom = chatBlock[0].scrollHeight - (chatBlock.scrollTop() + chatBlock.outerHeight());
    hypeBotBar.html(DOMPurify.sanitize(text));
    const newScrollTop = chatBlock[0].scrollHeight - (chatBlock.outerHeight() + originalScrollBottom);
    chatBlock.scrollTop(newScrollTop);
}

/**
 * Called when a chat event occurs to generate a HypeBot reply.
 * @param {boolean} clear Clear the hypebot bar.
 */
function onChatEvent(clear) {
    if (clear) {
        setHypeBotText('');
    }
    abortController?.abort();
    generateDebounced();
}

/**
 * Generates a HypeBot reply.
 */
async function generateHypeBot() {
    if (!settings.enabled || is_send_press) {
        return;
    }

    console.debug('Generating HypeBot reply');
    setHypeBotText(`<span class="hypebot_name">${settings.name}</span> is ${getWaitingVerb()}...`);

    const context = getContext();
    const chat = context.chat.slice();
    let prompt = '';

    for (let index = chat.length - 1; index >= 0; index--) {
        const message = chat[index];
        if (message.is_system || !message.mes) {
            continue;
        }
        prompt = `\n${message.mes}\n${prompt}`;
        if (prompt.length >= MAX_STRING_LENGTH) {
            break;
        }
    }

    if (!prompt) {
        setHypeBotText(`<span class="hypebot_name">${settings.name}</span> ${EMPTY_VERBS[Math.floor(Math.random() * EMPTY_VERBS.length)]}.`);
        return;
    }
    abortController = new AbortController();

    const response = await generateQuietPrompt(settings.prompt, false, true, null, settings.name, MAX_LENGTH);

    if (!response) {
        setHypeBotText('<div class="hypebot_error">Something went wrong while generating a HypeBot reply. Please try again.</div>');
        return;
    }
    setHypeBotText(formatReply(response));
}

jQuery(async () => {
    if (!extension_settings.hypebot) {
        extension_settings.hypebot = settings;
    }

    Object.assign(settings, extension_settings.hypebot);
    const getContainer = () => $(document.getElementById('hypebot_container') ?? document.getElementById('extensions_settings2'));
    getContainer().append(await renderExtensionTemplateAsync(MODULE_NAME, 'settings'));
    hypeBotBar = $('<div id="hypeBotBar"></div>').toggle(settings.enabled);
    $('#send_form').append(hypeBotBar);

    $('#hypebot_enabled').prop('checked', settings.enabled).on('input', () => {
        settings.enabled = $('#hypebot_enabled').prop('checked');
        hypeBotBar.toggle(settings.enabled);
        abortController?.abort();
        Object.assign(extension_settings.hypebot, settings);
        saveSettingsDebounced();
    });

    $('#hypebot_name').val(settings.name).on('input', () => {
        settings.name = String($('#hypebot_name').val());
        Object.assign(extension_settings.hypebot, settings);
        saveSettingsDebounced();
    });

    $('#hypebot_prompt').val(settings.prompt).on('input', () => {
        settings.prompt = String($('#hypebot_prompt').val());
        Object.assign(extension_settings.hypebot, settings);
        saveSettingsDebounced();
    });

    eventSource.on(event_types.CHAT_CHANGED, () => onChatEvent(true));
    eventSource.on(event_types.MESSAGE_DELETED, () => onChatEvent(true));
    eventSource.on(event_types.MESSAGE_EDITED, () => onChatEvent(true));
    eventSource.on(event_types.MESSAGE_SENT, () => onChatEvent(false));
    eventSource.on(event_types.MESSAGE_RECEIVED, () => onChatEvent(false));
    eventSource.on(event_types.MESSAGE_SWIPED, () => onChatEvent(false));
});

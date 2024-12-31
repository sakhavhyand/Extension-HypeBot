/* global SillyTavern */
import { useEffect, useState } from 'react';
import { useSettings } from './ContextManager';

async function importFromScript(what) {
    const module = await import(/* webpackIgnore: true */'../../../../../script.js');
    return module[what];
}
async function importFromUtils(what) {
    const module = await import(/* webpackIgnore: true */'../../../../utils.js');
    return module[what];
}
async function importFromSecrets(what) {
    const module = await import(/* webpackIgnore: true */'../../../../secrets.js');
    return module[what];
}
async function importFromPowerUser(what) {
    const module = await import(/* webpackIgnore: true */'../../../../power-user.js');
    return module[what];
}
async function importFromTokenizers(what) {
    const module = await import(/* webpackIgnore: true */'../../../../tokenizers.js');
    return module[what];
}

const debounce = await importFromUtils('debounce');
const bufferToBase64 = await importFromUtils('bufferToBase64');
const is_send_press = await importFromScript('is_send_press');
const SECRET_KEYS = await importFromSecrets('SECRET_KEYS');
const secret_state = await importFromSecrets('secret_state');
const collapseNewlines = await importFromPowerUser('collapseNewlines');
const tokenizers = await importFromTokenizers('tokenizers');
const decodeTextTokens = await importFromTokenizers('decodeTextTokens');
const getTextTokens = await importFromTokenizers('getTextTokens');


function BotBar() {

    const { settings } = useSettings();

    const [reactBotText, setReactBotText] = useState("");
    const eventSource = SillyTavern.getContext().eventSource;
    const event_types = SillyTavern.getContext().eventTypes;
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
    const generateDebounced = debounce(() => generateReactBot(), 500);
    let abortController;


    useEffect(() => {
        eventSource.on(event_types.CHAT_CHANGED, () => {
            console.debug("DEBUG-Event CHAT_CHANGED detected");
            onChatEvent(true);
        });
        eventSource.on(event_types.MESSAGE_DELETED, () => {
            console.debug("DEBUG-Event MESSAGE_DELETED detected");
            onChatEvent(true);
        });
        eventSource.on(event_types.MESSAGE_EDITED, () => {
            console.debug("DEBUG-Event MESSAGE_EDITED detected");
            onChatEvent(true);
        });
        eventSource.on(event_types.MESSAGE_SENT, () => {
            console.debug("DEBUG-Event MESSAGE_SENT detected");
            onChatEvent(false);
        });
        eventSource.on(event_types.MESSAGE_RECEIVED, () => {
            console.debug("DEBUG-Event MESSAGE_RECEIVED detected");
            onChatEvent(false);
        });
        eventSource.on(event_types.MESSAGE_SWIPED, () => {
            console.debug("DEBUG-Event MESSAGE_SWIPED detected");
            onChatEvent(false);
        });

    }, [settings, eventSource, event_types]);

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
     * Formats the ReactBot reply text
     * @param {string} text ReactBot output text
     * @returns {string} Formatted HTML text
     */
    function formatReply(text) {
        const validEndChars = ['.', '!', '?'];
        const endsWithValidChar = validEndChars.some(char => text.trim().endsWith(char));

        if (!endsWithValidChar) {
            const match = text.match(/.*[.!?]/s);
            text = match ? match[0] : '';
        }
        return `<span class="reactbot_name">${settings.name} ${getVerb(text)}:</span>&nbsp;<span class="reactbot_text">${text}</span>`;
    }

    /**
     * Sets the ReactBot text. Preserves scroll position of the chat.
     * @param {string} text Text to set
     */
    function setBotText(text) {
        function onChatElementReady(callback) {
            const chatBlock = document.getElementById('chat');
            if (chatBlock) {
                callback(chatBlock);
                return;
            }
            const observer = new MutationObserver(() => {
                const chatBlock = document.getElementById('chat');
                if (chatBlock) {
                    observer.disconnect();
                    callback(chatBlock);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        onChatElementReady(chatBlock => {
            try {
                const originalScrollBottom = chatBlock.scrollHeight - (chatBlock.scrollTop + chatBlock.offsetHeight);
                setReactBotText(text);
                chatBlock.scrollTop = chatBlock.scrollHeight - (chatBlock.offsetHeight + originalScrollBottom);
            } catch (error) {
                console.error("Une erreur s'est produite en manipulant l'élément #chat :", error);
            }
        });
    }

    /**
     * Called when a chat event occurs to generate a ReactBot reply.
     * @param {boolean} clear Clear the reactbot bar.
     */
    function onChatEvent(clear) {
        if (clear) {
            setBotText('');
        }
        abortController?.abort();
        generateDebounced();
    }

    /**
     * Generates a ReactBot reply.
     */
    async function generateReactBot() {
        if (!validateSettingsAndState()) {
            return;
        }

        setBotText(`<span class="ractbot_name">${settings.name}</span> is ${getWaitingVerb()}...`);

        const prompt = buildPrompt();
        if (!prompt) {
            setBotText(`<span class="reactbot_name">${settings.name}</span> ${EMPTY_VERBS[Math.floor(Math.random() * EMPTY_VERBS.length)]}.`);
            return;
        }

        abortController = new AbortController();

        try {
            const response = settings.endpoint === 1
                ? await SillyTavern.getContext().generateQuietPrompt(settings.prompt, false, true, null, settings.name, MAX_LENGTH)
                : await generateNovelAI(prompt);

            if (!response) {
                setErrorText('Something went wrong while generating a ReactBot reply. Please try again.');
                return;
            }

            const formattedResponse = settings.endpoint === 1
                ? formatReply(response)
                : processNovelAIdResponse(await response.json());

            setBotText(formattedResponse);
        } catch (error) {
            setErrorText('Something went wrong while generating a ReactBot reply. Please try again.');
        }
    }

    /**
     * Validates the current settings and application state to ensure required conditions are met.
     * @return {boolean} Returns `true` if the settings and state are valid; otherwise, returns `false`.
     */
    function validateSettingsAndState() {
        if (!settings.enabled || is_send_press) {
            return false;
        }
        if (!secret_state[SECRET_KEYS.NOVEL] && settings.endpoint === 0) {
            setErrorText('No API key found. Please enter your API key in the NovelAI API Settings to use the ReactBot.');
            return false;
        }
        return true;
    }

    /**
     * Constructs a prompt string by iterating over a chat history in reverse order.
     * Filters out system messages and includes user messages up to a defined maximum string length.
     * Cleans the resulting prompt by collapsing newlines and removing certain special characters.
     * @return {string} The constructed and cleaned prompt string.
     */
    function buildPrompt() {
        const context = SillyTavern.getContext();
        const chat = context.chat.slice();
        let prompt = '';

        for (let index = chat.length - 1; index >= 0; index--) {
            const message = chat[index];
            if (!message.is_system && message.mes) {
                prompt = `\n${message.mes}\n${prompt}`;
                if (prompt.length >= MAX_STRING_LENGTH) {
                    break;
                }
            }
        }

        return collapseNewlines(prompt.replaceAll(/[*[\]{}]/g, ''));
    }

    /**
     * Generates a response from the bot based on the provided prompt input.
     *
     * @param {string} prompt - The input text used to generate the bot's response.
     * @return {Promise<Response>} A promise that resolves to the fetch API Response object containing the bot's generated reply.
     */
    async function generateNovelAI(prompt) {
        const sliceLength = MAX_PROMPT - MAX_LENGTH;
        const encoded = getTextTokens(tokenizers.GPT2, prompt).slice(-sliceLength);
        encoded.push(49527); // Add stop string token
        const base64String = await bufferToBase64(new Uint16Array(encoded).buffer);

        const apiParameters = {
            input: base64String,
            model: 'hypebot',
            streaming: false,
            temperature: 1,
            max_length: MAX_LENGTH,
            min_length: 1,
            top_k: 0,
            top_p: 1,
            tail_free_sampling: 0.95,
            repetition_penalty: 1,
            repetition_penalty_range: 2048,
            repetition_penalty_slope: 0.18,
            repetition_penalty_frequency: 0,
            repetition_penalty_presence: 0,
            phrase_rep_pen: 'off',
            bad_words_ids: [],
            stop_sequences: [[48585]],
            generate_until_sentence: true,
            use_cache: false,
            use_string: false,
            return_full_text: false,
            prefix: 'vanilla',
            logit_bias_exp: [],
            order: [0, 1, 2, 3],
        };

        return await fetch('/api/novelai/generate', {
            headers: SillyTavern.getContext().getRequestHeaders(),
            body: JSON.stringify(apiParameters),
            method: 'POST',
            signal: abortController.signal,
        });
    }

    /**
     * Processes the fetched response by decoding and formatting it.
     *
     * @param {Object} data The response data object containing the information to process.
     * @param {string} data.output The base64-encoded output string to decode and process.
     * @return {string} The formatted and processed response string.
     */
    function processNovelAIdResponse(data) {
        const ids = Array.from(new Uint16Array(Uint8Array.from(atob(data.output), c => c.charCodeAt(0)).buffer));
        const tokens = decodeTextTokens(tokenizers.GPT2, ids);
        const output = (typeof tokens === 'string' ? tokens : tokens.text).replace(/�/g, '').trim();
        return formatReply(output);
    }

    /**
     * Sets the error text to be displayed in a designated format.
     *
     * @param {string} message The error message to be displayed.
     * @return {void}
     */
    function setErrorText(message) {
        setBotText(`<div class="reactbot_error">${message}</div>`);
    }

    return (
        <div
            id="reactBotBar"
            style={{ display: settings.enabled ? "block" : "none" }}
            dangerouslySetInnerHTML={{ __html: reactBotText }}
        >
        </div>
    );
}

export default BotBar;

const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// In-memory conversation store (use Redis in production)
const conversations = new Map();

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a smart shopping assistant for Synapse Commerce, an AI-powered product search engine.

Your job is to understand user queries and extract structured search parameters.

ALWAYS respond with a JSON object containing:
{
    "searchQuery": "the optimized search text for semantic vector search",
    "filters": {
        "minPrice": number or null,
        "maxPrice": number or null,
        "category": string or null,
        "color": string or null
    },
    "intent": "new_search" | "refine" | "similar" | "filter_only",
    "clarification": null or "question to ask user if query is ambiguous",
    "summary": "A brief, friendly summary of what you understood (1 sentence)"
}

Examples:
- User: "red winter jacket" → searchQuery: "red winter jacket cozy warm outerwear", intent: "new_search"
- User: "something similar but cheaper" → intent: "refine", modify maxPrice based on context
- User: "show me in blue instead" → searchQuery: same concept but "blue" color, intent: "refine"
- User: "under $50" → intent: "filter_only", update maxPrice to 50
- User: "more like this but for summer" → searchQuery: lighter/summer version, intent: "refine"

Be creative in expanding search queries with related terms for better semantic matching.
If the user says "cheaper", reduce maxPrice by ~30% from current context.
If they say "more expensive" or "premium", increase minPrice.`;

/**
 * Process a conversational search query
 * @param {string} sessionId - Unique session identifier
 * @param {string} userMessage - The user's message
 * @param {object} currentContext - Current search context (results, filters, etc.)
 * @returns {object} Structured search parameters
 */
async function processConversation(sessionId, userMessage, currentContext = {}) {
    // Get or create conversation history
    if (!conversations.has(sessionId)) {
        conversations.set(sessionId, []);
    }
    
    const history = conversations.get(sessionId);
    
    // Build context message
    const contextMessage = currentContext.lastQuery 
        ? `Current context: User previously searched for "${currentContext.lastQuery}". Current price filter: max $${currentContext.maxPrice || 'none'}. Found ${currentContext.resultCount || 0} products.`
        : 'This is a new conversation.';

    // Add user message to history
    history.push({
        role: 'user',
        content: `${contextMessage}\n\nUser says: "${userMessage}"`
    });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Cost-effective and fast
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                ...history.slice(-6) // Keep last 6 messages for context
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 500
        });

        const assistantMessage = response.choices[0].message.content;
        
        // Add assistant response to history
        history.push({
            role: 'assistant',
            content: assistantMessage
        });

        // Parse and return structured response
        const parsed = JSON.parse(assistantMessage);
        
        // Limit history size
        if (history.length > 20) {
            history.splice(0, history.length - 10);
        }

        return {
            success: true,
            ...parsed,
            sessionId
        };

    } catch (error) {
        console.error('Conversation AI Error:', error);
        
        // Fallback: Use the raw query as search
        return {
            success: false,
            searchQuery: userMessage,
            filters: {},
            intent: 'new_search',
            summary: `Searching for "${userMessage}"`,
            error: error.message
        };
    }
}

/**
 * Clear conversation history for a session
 */
function clearConversation(sessionId) {
    conversations.delete(sessionId);
}

/**
 * Get conversation history
 */
function getConversationHistory(sessionId) {
    return conversations.get(sessionId) || [];
}

module.exports = {
    processConversation,
    clearConversation,
    getConversationHistory
};

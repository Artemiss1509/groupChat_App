import { GoogleGenerativeAI } from '@google/generative-ai';
import {GEMINI_API_KEY} from './env.js';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

class GeminiService {
    constructor() {
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }

    async getPredictiveText(currentText, conversationHistory = []) {
        try {
            const contextMessages = conversationHistory
                .slice(-5)
                .map(msg => `${msg.senderName}: ${msg.content}`)
                .join('\n');

            const prompt = `You are a predictive text assistant for a chat application. 
Context of recent conversation:
${contextMessages || 'No previous context'}

Current incomplete message:  "${currentText}"

Provide exactly 3 short, natural completions for this message. Only complete the sentence, don't repeat what's already typed. 
Return ONLY the completions as a JSON array, nothing else. 
Example format: ["completion 1", "completion 2", "completion 3"]

Keep completions concise (2-5 words max).`;

            const result = await this. model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();
            
            const suggestions = JSON.parse(text);
            return suggestions. slice(0, 3);
        } catch (error) {
            console.error('Error generating predictive text:', error);
            return [];
        }
    }

    async getSmartReplies(incomingMessage, conversationHistory = []) {
        try {
            const contextMessages = conversationHistory
                .slice(-5)
                .map(msg => `${msg.senderName}: ${msg.content}`)
                .join('\n');

            const prompt = `You are a smart reply assistant for a chat application. 
Context of recent conversation:
${contextMessages || 'No previous context'}

Latest message to reply to: "${incomingMessage}"

Generate exactly 3 diverse, natural quick reply options that would be appropriate responses. 
Make them varied in tone and length (affirmative, questioning, or informative).
Return ONLY the replies as a JSON array, nothing else.
Example format: ["Yes, I'll be there!", "What time works best?", "Let me check my schedule"]

Keep replies conversational and under 10 words each.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();
            
            const replies = JSON.parse(text);
            return replies.slice(0, 3);
        } catch (error) {
            console.error('Error generating smart replies:', error);
            return [];
        }
    }
}

export default new GeminiService();
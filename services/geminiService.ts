import { GoogleGenAI, ChatSession, GenerativeModel } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatSession: ChatSession | null = null;
let genAI: GoogleGenAI | null = null;

export const initializeGemini = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing in environment variables.");
    return;
  }
  
  try {
    genAI = new GoogleGenAI({ apiKey });
    const model = "gemini-2.5-flash";
    
    // Create a new chat session with system instructions
    chatSession = genAI.chats.create({
      model: model,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, 
      },
    });
  } catch (error) {
    console.error("Failed to initialize Gemini:", error);
  }
};

export const sendMessageToOrchestrator = async (message: string): Promise<{ text: string; commands: string[] }> => {
  if (!chatSession) {
    initializeGemini();
    if (!chatSession) {
        // Fallback mock response if API fails or is missing
        return {
            text: "调度器离线 (API Key 缺失)。模拟响应：切换至请求的视图。",
            commands: message.toLowerCase().includes('style') ? ['[VIEW:STYLING]'] : 
                      message.toLowerCase().includes('cad') ? ['[VIEW:CAD]'] :
                      message.toLowerCase().includes('mesh') ? ['[VIEW:MESHING]'] :
                      message.toLowerCase().includes('sim') ? ['[VIEW:CFD]'] : []
        }
    }
  }

  try {
    const result = await chatSession.sendMessage({ message });
    const fullText = result.text || "";
    
    // Extract commands
    const commandRegex = /\[(VIEW|ACTION):[A-Z_]+\]/g;
    const commands = fullText.match(commandRegex) || [];
    
    // Remove commands from display text for cleaner UI
    const cleanText = fullText.replace(commandRegex, '').trim();

    return {
      text: cleanText,
      commands
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      text: "与智能体网络通信时发生错误。",
      commands: []
    };
  }
};
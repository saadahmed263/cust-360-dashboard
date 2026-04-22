import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import fs from 'fs';
import path from 'path';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, fileContext } = await req.json();

    // BUGFIX 2: Strip out any empty messages from previous crashes
    const safeMessages = messages.filter((m: any) => m.content && m.content.trim() !== "");

    let contextData = "";

    // If the user dragged a file into the UI, use THAT data
    if (fileContext && fileContext.trim() !== "") {
      console.log("Reading data from Drag-and-Drop UI...");
      contextData = fileContext;
    } 
    // Otherwise, fall back to the safe, hardcoded local file
    else {
      console.log("No UI file found. Falling back to local appbot-data.csv...");
      const filePath = path.join(process.cwd(), 'appbot-data.csv');
      try {
        contextData = fs.readFileSync(filePath, 'utf8');
      } catch (e) {
        console.log("Could not find local fallback file.");
        contextData = "No research data was found.";
      }
    }

    const systemPrompt = `You are an expert UX Research Assistant. 
    Answer the user's questions using ONLY the provided research data below.
    
    --- START OF RESEARCH DATA ---
    ${contextData}
    --- END OF RESEARCH DATA ---`;

    // BUGFIX 1: Reverting back to Haiku 
    const result = await streamText({
      model: anthropic('claude-3-5-haiku-latest'),
      system: systemPrompt,
      messages: safeMessages, // Use the sanitized history
    });

    return result.toTextStreamResponse(); 
    
  } catch (error) {
    console.error("=== API ROUTE CRASHED ===", error);
    return new Response("Server Error", { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // If text is already short, return as is
    if (text.length <= 50) {
      return NextResponse.json({ summary: text });
    }

    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes text into concise 2-3 word phrases. Focus on the core concept of the text. Respond with only the summary, nothing else."
        },
        {
          role: "user",
          content: `Summarize this into a 2-3 word phrase: ${text}`
        }
      ],
      max_tokens: 10,
      temperature: 0.3
    });

    const summary = response.choices[0]?.message?.content?.trim() || text.substring(0, 50);
    console.log("Summary:", summary);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { error: "Failed to summarize text" },
      { status: 500 }
    );
  }
}
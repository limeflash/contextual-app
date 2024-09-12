import { NextResponse } from 'next/server';

const OLLAMA_SERVER_URL = 'http://127.0.0.1:11434/api/generate';

export async function POST(request: Request) {
  try {
    const { input_text } = await request.json();
    console.log('Received input text:', input_text);

    if (!input_text) {
      return NextResponse.json({ error: 'Input text is required' }, { status: 400 });
    }

    console.log('Sending request to Ollama server...');
    const aiResponse = await fetch(OLLAMA_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama3.1",
        prompt: `Categorize the following text, provide a brief description, and suggest relevant tags. Respond with a JSON object containing 'category', 'description', and 'tags'. Ensure the response is in the same language as the input text, but the keys ('category', 'description', 'tags') should always be in English: "${input_text}"`,
        stream: false
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Ollama server error response:', errorText);
      throw new Error(`Ollama server responded with status: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    console.log('Raw AI Response:', aiResult);

    // Check if the response contains the expected JSON object
    let aiContent;
    try {
      aiContent = JSON.parse(aiResult.response);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      aiContent = {
        category: 'Uncategorized',
        description: 'No description provided',
        tags: []
      };
    }

    // Ensure the response contains the required fields
    const category = aiContent.category || 'Uncategorized';
    const description = aiContent.description || 'No description provided';
    const tags = Array.isArray(aiContent.tags) ? aiContent.tags : [];

    console.log('Parsed AI Content:', { category, description, tags });

    return NextResponse.json({
      category,
      description,
      tags
    }, { status: 200 });

  } catch (error) {
    console.error('Error in categorize API:', error);
    return NextResponse.json({ error: 'Failed to categorize text: ' + error.message }, { status: 500 });
  }
}

const { default: OpenAI } = require('openai');

const FREE_MODELS = [
  'meta-llama/llama-3-8b-instruct:free',
  'google/gemma-2-9b-it:free',
  'mistralai/mistral-7b-instruct:free',
];

const getRealAIResponse = async (prompt) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    timeout: 15000, // Increased timeout for slower models
  });

  for (const model of FREE_MODELS) {
    try {
      console.log(`Trying AI model: ${model}`);
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are NexMeet AI, a helpful and concise assistant integrated into a video conferencing app.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 512,
      });
      return completion.choices[0].message.content;
    } catch (error) {
      console.error(`Model ${model} failed:`, error.message);
      // Continue to the next model if it's a rate limit, timeout, or model not found error.
      if (!['429', '408', '404'].some(code => error.message.includes(code))) {
        // For other errors (like auth), stop trying.
        throw new Error('AI service failed. Please check API key or try again later.');
      }
    }
  }
  // If all models fail, throw an error.
  throw new Error('All available AI models are currently busy. Please try again in a moment.');
};

const getMockAIResponse = (prompt) => {
  const mockResponses = {
    general: `I'm NexMeet AI! I can help you with programming questions, meeting summaries, generating notes, translating text, explaining code, fixing bugs, and much more. What would you like help with?`,
    code: `Here's a solution:\n\n\`\`\`javascript\nconsole.log("NexMeet AI is ready!");\n\`\`\`\n\nLet me know if you need modifications!`,
    meeting: `Meeting Summary:\n\n📋 **Key Points:**\n- Project updates\n- Team collaboration\n- Next steps\n\n✅ **Action Items:**\n1. Follow up on tasks\n2. Schedule next meeting`,
  };

  if (prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('bug')) return mockResponses.code;
  if (prompt.toLowerCase().includes('meeting') || prompt.toLowerCase().includes('summary')) return mockResponses.meeting;
  return mockResponses.general;
}

// @POST /api/ai/chat
exports.aiChat = async (req, res, next) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });

  try {
    let response;
    if (process.env.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY.includes('your_')) {
      response = await getRealAIResponse(prompt);
    } else {
      response = getMockAIResponse(prompt);
    }
    res.json({ success: true, response });
  } catch (error) {
    next(error); // Pass error to the global error handler
  }
};

const FREE_MODELS = [
  'openai/gpt-oss-20b:free',
  'openai/gpt-oss-120b:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'google/gemma-4-31b-it:free',
];

const getAIResponse = async (prompt, type) => {
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key') {
    const { default: OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      timeout: 10000,
    });
    for (const model of FREE_MODELS) {
      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: 'You are NexMeet AI, a helpful assistant. Be concise.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 500,
        });
        return completion.choices[0].message.content;
      } catch (e) {
        if (!e.message?.includes('429') && !e.message?.includes('404')) throw e;
      }
    }
  }

  const mockResponses = {
    general: `I'm NexMeet AI! I can help you with programming questions, meeting summaries, generating notes, translating text, explaining code, fixing bugs, and much more. What would you like help with?`,
    code: `Here's a solution:\n\n\`\`\`javascript\nconsole.log("NexMeet AI is ready!");\n\`\`\`\n\nLet me know if you need modifications!`,
    meeting: `Meeting Summary:\n\n📋 **Key Points:**\n- Project updates\n- Team collaboration\n- Next steps\n\n✅ **Action Items:**\n1. Follow up on tasks\n2. Schedule next meeting`,
  };

  if (prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('bug')) return mockResponses.code;
  if (prompt.toLowerCase().includes('meeting') || prompt.toLowerCase().includes('summary')) return mockResponses.meeting;
  return mockResponses.general;
};

// @POST /api/ai/chat
exports.aiChat = async (req, res) => {
  const { prompt, type } = req.body;
  if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });
  const response = await getAIResponse(prompt, type);
  res.json({ success: true, response });
};

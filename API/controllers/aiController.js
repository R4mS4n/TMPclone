require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

// Configuración de la API de Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY,
});

/**
 * Análisis de código utilizando Google GenAI
 */
const analyzeCode = async (req, res) => {
  try {
    const { code, questionContent } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const prompt = `
You are a programming expert. Analyze the following code and suggest:
- Style improvements
- Best practices
- Corrections if there are errors
- Code suggestions

${questionContent ? `Context of the question: ${questionContent}` : ''}

Code:
\`\`\`
${code}
\`\`\`

  No bold or italics.
`;

    console.log('[ANALYZE] Prompt generado:', prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    console.log('[ANALYZE] API Response:', JSON.stringify(response, null, 2));

    const suggestion = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!suggestion) {
      return res.status(500).json({ error: 'Failed to analyze code', details: 'Empty response from AI' });
    }

    console.log('[ANALYZE] Sugerencia generada:', suggestion);
    res.status(200).json({ suggestion });

  } catch (error) {
    console.error('[ANALYZE] Error en el análisis:', error.message || error);
    res.status(500).json({ error: 'Failed to analyze code', details: error.message });
  }
};

module.exports = { analyzeCode };

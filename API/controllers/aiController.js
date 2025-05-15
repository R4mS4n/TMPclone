import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY,
});

export const analyzeCode = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const prompt = `
Eres un experto en programación. Analiza el siguiente código y sugiere:
- Mejoras de estilo
- Buenas prácticas
- Correcciones si hay errores

Código:
\`\`\`
${code}
\`\`\`

Responde en máximo 3 líneas.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    console.log("API Response:", JSON.stringify(response, null, 2));

    const suggestion = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!suggestion) {
      return res.status(500).json({ error: "Failed to analyze code", details: "Empty response from AI" });
    }

    res.status(200).json({ suggestion });
  } catch (error) {
    console.error('AI analysis error:', error.message || error);
    res.status(500).json({ error: 'Failed to analyze code', details: error.message });
  }
};

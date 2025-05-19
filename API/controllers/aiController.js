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
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const prompt = `
Eres un experto en programación. Analiza el siguiente código y sugiere:
- Mejoras de estilo
- Buenas prácticas
- Correcciones si hay errores

Código:
\u0060\u0060\u0060
${code}
\u0060\u0060\u0060

Responde en máximo 3 líneas.
`;

    console.log('[ANALYZE] Prompt generado:', prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    console.log('[ANALYZE] API Response:', JSON.stringify(response, null, 2));

    const suggestion = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

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

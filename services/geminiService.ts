import { GoogleGenAI } from "@google/genai";

// Initialize the client. 
// Note: In a real Netlify deploy, process.env.API_KEY is populated via environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeFault = async (faultDescription: string, assetModel: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Simulación: Configure la API Key de Gemini para diagnósticos reales.\n\nDiagnóstico simulado: Basado en el modelo " + assetModel + ", el fallo '" + faultDescription + "' sugiere revisar:\n1. Sensores de presión.\n2. Fugas en latiguillos.\n3. Nivel de fluido hidráulico.";
  }

  try {
    const prompt = `Actúa como un experto mecánico industrial senior.
    Tengo una máquina modelo: "${assetModel}".
    El reporte de avería es: "${faultDescription}".
    
    Dame un diagnóstico conciso en formato lista con:
    1. Causas probables (máx 3).
    2. Acciones recomendadas inmediatas.
    3. Herramientas necesarias.
    
    Responde en texto plano formateado.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No se pudo generar el diagnóstico.";
  } catch (error) {
    console.error("Error calling Gemini:", error);
    return "Error al conectar con el asistente inteligente.";
  }
};

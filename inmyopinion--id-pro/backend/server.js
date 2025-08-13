
require('dotenv').config();
const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// --- Middleware ---
// Enable CORS for all routes to allow frontend to communicate with this server
app.use(cors());
// Enable parsing of JSON request bodies
app.use(express.json({ limit: '10mb' })); // Increased limit for file uploads

// --- Gemini API Initialization ---
// The API key is securely loaded from environment variables on the server
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set!");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- API Routes ---

/**
 * @route POST /api/generate
 * @desc Handles general content generation requests from the frontend.
 * @access Public
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { requestPayload, schema, sourceDocumentContent } = req.body;

    if (!requestPayload || !schema) {
      return res.status(400).json({ error: 'Missing requestPayload or schema in request body' });
    }
    
    let finalPrompt = JSON.stringify(requestPayload);

    if (sourceDocumentContent) {
        finalPrompt = `Based on the following knowledge source context, please fulfill the user's prompt.\n\n--- KNOWLEDGE SOURCE START ---\n${sourceDocumentContent}\n--- KNOWLEDGE SOURCE END ---\n\nUser Prompt: ${JSON.stringify(requestPayload)}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
      config: {
        systemInstruction: req.body.systemInstruction, // Pass system instruction from client
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    res.json(JSON.parse(response.text));

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to call Gemini API', details: error.message });
  }
});

/**
 * @route POST /api/generate-image
 * @desc Handles image generation requests.
 * @access Public
 */
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt, config } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Missing prompt for image generation' });
        }

        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              ...config // Allow client to override defaults like aspectRatio
            },
        });

        res.json(response);

    } catch (error) {
        console.error('Error calling Image Generation API:', error);
        res.status(500).json({ error: 'Failed to generate image', details: error.message });
    }
});


// --- Server Initialization ---
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});

// Export the app for Vercel's serverless environment
module.exports = app;

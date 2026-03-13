const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;
const GOOGLE_API_KEY = process.env.GOOGLE_VISION_API_KEY;

app.post('/api/scan', async (req, res) => {
    try {
        const { image } = req.body; // Imagen en base64

        const response = await axios.post(
            `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
            {
                requests: [
                    {
                        image: { content: image.split(',')[1] }, // Quitamos el prefijo data:image/png;base64
                        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
                    }
                ]
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error procesando con Google Vision');
    }
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
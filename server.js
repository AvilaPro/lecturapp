const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path'); // Añade esto
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- ESTA ES LA CLAVE PARA EL FRONTEND ---
// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const GOOGLE_API_KEY = process.env.GOOGLE_VISION_API_KEY;

// Tu ruta de API sigue igual
app.post('/api/scan', async (req, res) => {
    try {
        const { image } = req.body;
        const response = await axios.post(
            `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
            {
                requests: [
                    {
                        image: { content: image.split(',')[1] },
                        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
                    }
                ]
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
});

// Ruta para que cualquier otra petición cargue el index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
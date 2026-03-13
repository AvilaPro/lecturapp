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
                requests: [{
                    image: { content: image.split(',')[1] },
                    features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
                }]
            }
        );
        res.json(response.data);
    } catch (error) {
        // Esto imprimirá el error real en los logs de Railway
        console.error("DETALLE DEL ERROR:", error.response ? error.response.data : error.message);

        // Enviamos el detalle al frontend para saber qué pasa mientras pruebas
        res.status(500).json({
            error: 'Fallo en Google Vision',
            detalle: error.response ? error.response.data : error.message
        });
    }
});

// Ruta para que cualquier otra petición cargue el index.html
app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(indexPath);
});

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
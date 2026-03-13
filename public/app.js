const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const snap = document.getElementById('snap');
const startCamera = document.getElementById('start-camera');
const headersContainer = document.getElementById('headers-container');
const addHeaderBtn = document.getElementById('add-header');
const loading = document.getElementById('loading');
const fileInput = document.getElementById('file-input');

// 1. Agregar más inputs de encabezados
addHeaderBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Nueva Columna';
    input.className = 'header-input border p-2 rounded-md focus:ring-2 focus:ring-blue-500 outline-none';
    headersContainer.appendChild(input);
});

// 2. Acceso a la cámara
startCamera.addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        video.classList.remove('hidden');
        snap.classList.remove('hidden');
        startCamera.classList.add('hidden');
    } catch (err) {
        alert("Error al acceder a la cámara: " + err);
    }
});

// 3. Captura y Procesamiento
snap.addEventListener('click', () => {
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Detener cámara para ahorrar recursos
    video.srcObject.getTracks().forEach(track => track.stop());
    video.classList.add('hidden');
    snap.classList.add('hidden');

    processImage();
});

async function processImage() {
    loading.classList.remove('hidden');
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    try {
        const API_URL = '/api/scan'; // Así funcionará tanto local como en Railway

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageData })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error del servidor:", errorData);
            alert(`Error: ${errorData.detalle || 'Error desconocido'}`);
            loading.classList.add('hidden');
            return;
        }

        const data = await response.json();
        const fullTextAnnotation = data.responses[0].fullTextAnnotation;

        if (fullTextAnnotation) {
            displayResultsFromVision(fullTextAnnotation);
        } else {
            alert("No se detectó texto en la imagen.");
            loading.classList.add('hidden');
        }

    } catch (err) {
        console.error(err);
        alert("Error al conectar con el servidor.");
        loading.classList.add('hidden');
    }
}

function displayResultsFromVision(annotation) {
    loading.classList.add('hidden');
    const tableBody = document.getElementById('table-body');
    const headers = Array.from(document.querySelectorAll('.header-input'))
        .map(input => input.value || "Columna");

    tableBody.innerHTML = '';

    // Google Vision organiza por bloques y párrafos
    // Aquí tomamos cada bloque de texto como una fila potencial o procesamos líneas
    annotation.pages[0].blocks.forEach(block => {
        block.paragraphs.forEach(para => {
            const row = document.createElement('tr');
            const paraText = para.words.map(w => w.symbols.map(s => s.text).join('')).join(' ');

            // Lógica simple: dividir el texto del párrafo por espacios para llenar columnas
            const words = paraText.split(/\s+/);

            headers.forEach((_, index) => {
                const td = document.createElement('td');
                td.className = "border p-2 text-sm outline-none focus:bg-yellow-50";
                td.contentEditable = "true";
                td.innerText = words[index] || "";
                row.appendChild(td);
            });
            tableBody.appendChild(row);
        });
    });

    document.getElementById('result-area').classList.remove('hidden');
}

// 4. Función para Exportar a CSV
document.getElementById('export-csv').addEventListener('click', () => {
    const table = document.querySelector("table");
    let csvContent = "\uFEFF"; // BOM para que Excel reconozca tildes y Ñ

    // Obtener filas
    const rows = Array.from(table.querySelectorAll("tr"));

    rows.forEach(row => {
        const cols = Array.from(row.querySelectorAll("th, td"))
            .map(col => `"${col.innerText.replace(/"/g, '""')}"`); // Escapar comillas
        csvContent += cols.join(",") + "\r\n";
    });

    // Crear descarga
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.setAttribute("href", url);
    link.setAttribute("download", `tabla_escaneada_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// 5. Lógica para subir archivo desde galería
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            // Ajustamos el canvas al tamaño de la imagen subida
            const context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);

            // Detenemos la cámara si estaba encendida
            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.classList.add('hidden');
                snap.classList.add('hidden');
            }

            // Procesamos la imagen igual que si fuera una foto tomada
            processImage();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});
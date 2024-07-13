// Cargar las variables de entorno desde un archivo .env
require('dotenv').config();

// Importar las dependencias necesarias
const express = require('express'); // Framework para crear aplicaciones web en Node.js
const multer = require('multer'); // Middleware para manejar la subida de archivos
const mongoose = require('mongoose'); // Librería para interactuar con MongoDB
const path = require('path'); // Módulo para manejar y transformar rutas de archivos y directorios
const File = require('./models/files.model'); // Importar el modelo de archivo definido en './models/files.model'
const app = express(); // Crear una instancia de la aplicación Express
const port = 3007; // Puerto en el que se ejecutará el servidor Express
const cors = require('cors'); // Middleware para habilitar CORS (Cross-Origin Resource Sharing)

// Configurar CORS para permitir peticiones desde cualquier origen
app.use(cors());

// Configuración de multer para manejar la subida de archivos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './files'); // Directorio donde se guardarán los archivos subidos
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Nombre del archivo (se añade un timestamp para evitar nombres duplicados)
    }
});

const upload = multer({ storage: storage }); // Configurar multer con la opción de almacenamiento definida

// Ruta para subir archivos mediante POST
app.post('/api/upload', upload.single('file'), async (req, res) => {
    // Registrar en consola cuando se recibe una petición para subir archivo
    console.log('Petición recibida para subir archivo:', req.file);

    try {
        // Guardar la información del archivo en MongoDB utilizando el modelo definido
        const newFile = new File({
            filename: req.file.filename, // Nombre original del archivo
            path: req.file.path, // Ruta local donde se guarda el archivo en el servidor
            url: `https://${process.env.URL_HOST}/files/${req.file.filename}` // URL pública del archivo generado
        });

        await newFile.save(); // Guardar el archivo en la base de datos MongoDB

        // Devolver la URL pública del archivo subido como respuesta
        res.json({ url: newFile.url });
    } catch (err) {
        // Manejar errores en caso de fallo al guardar el archivo en MongoDB
        console.error('Error al guardar el archivo en MongoDB:', err);
        res.status(500).json({ error: 'Error al subir el archivo' }); // Devolver código de error 500 y mensaje JSON de error
    }
});

// Iniciar el servidor Express y escuchar peticiones en el puerto especificado
app.listen(port, () => {
    console.log(`Servidor Express escuchando en http://localhost:${port}`);
});

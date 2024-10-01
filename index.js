// Cargar las variables de entorno desde un archivo .env
require('dotenv').config();

// Importar las dependencias necesarias
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fileModel = require('./models/files.model');
const app = express();
const port = 3007;
const cors = require('cors');
const db = require('./conf/db');
app.use(cors());

// Configuración de multer para manejar la subida de archivos sin restricciones
let storage;
if (process.env.PRODUCTION === 'true') {
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './files'); // Directorio de producción
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname); // Nombre del archivo
        }
    });
    app.use('/files', express.static('files'));
} else {
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './files_dev'); // Directorio de desarrollo
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname); // Nombre del archivo
        }
    });
    app.use('/files_dev', express.static('files_dev'));
}

// Configurar multer sin restricciones de tipo de archivo
const upload = multer({
    storage: storage
});

// Ruta para subir archivos mediante POST
app.post('/api/upload', upload.single('file'), async (req, res) => {
    // Registrar en consola cuando se recibe una petición para subir archivo
    console.log('Petición recibida para subir archivo:', req.file);

    try {
        // Construir la URL pública del archivo subido
        let url;
        if (process.env.PRODUCTION === 'true') {
            url = `${process.env.URL_HOST}/files/${req.file.filename}`;
        } else {
            url = `${process.env.URL_HOST}/files_dev/${req.file.filename}`;
        }

        // Guardar la información del archivo en MongoDB utilizando el modelo definido
        const newFile = await fileModel.create({
            filename: req.file.filename, // Nombre original del archivo
            path: req.file.path, // Ruta local donde se guarda el archivo en el servidor
            url: url, // URL pública del archivo generado
            mimetype: req.file.mimetype // Tipo de archivo
        });

        // Devolver la URL pública del archivo subido como respuesta
        res.status(200).json({
            success: true,
            url: url
        });

    } catch (err) {
        // Manejar errores en caso de fallo al guardar el archivo en MongoDB
        console.error('Error al guardar el archivo en MongoDB:', err);
        res.status(500).json({
            success: false,
            error: err
        });
    }
});

// Iniciar el servidor Express y escuchar peticiones en el puerto especificado
app.listen(port, () => {
    console.log(`Servidor Express escuchando en http://localhost:${port}`);
});

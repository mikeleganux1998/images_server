// Cargar las variables de entorno desde un archivo .env
require('dotenv').config();

// Importar las dependencias necesarias
const express = require('express'); // Framework para crear aplicaciones web en Node.js
const multer = require('multer'); // Middleware para manejar la subida de archivos
const mongoose = require('mongoose'); // Librería para interactuar con MongoDB
const path = require('path'); // Módulo para manejar y transformar rutas de archivos y directorios
const fileModel = require('./models/files.model'); // Importar el modelo de archivo definido en './models/files.model'
const app = express(); // Crear una instancia de la aplicación Express
const port = 3007; // Puerto en el que se ejecutará el servidor Express
const cors = require('cors'); // Middleware para habilitar CORS (Cross-Origin Resource Sharing)

// Configurar CORS para permitir peticiones desde cualquier origen
app.use(cors());

// Configuración de multer para manejar la subida de archivos
let storage;
if (process.env.PRODUCTION) {
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './files'); // Directorio de producción
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname); // Nombre del archivo
        }
    });
} else {
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './files_dev'); // Directorio de desarrollo
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + '-' + file.originalname); // Nombre del archivo
        }
    });
}


const upload = multer({storage: storage}); // Configurar multer con la opción de almacenamiento definida

// Ruta para subir archivos mediante POST
app.post('/api/upload', upload.single('file'), async (req, res) => {
    // Registrar en consola cuando se recibe una petición para subir archivo
    console.log('Petición recibida para subir archivo:', req.file);

    try {
        // Construir la URL pública del archivo subido
        let url
        if (process.env.PRODUCTION) {
            url = `https://${process.env.URL_HOST}/files/${req.file.filename}`;
        } else {
            url = `https://${process.env.URL_HOST}/files_dev/${req.file.filename}`;
        }


        // Guardar la información del archivo en MongoDB utilizando el modelo definido
        const newFile = fileModel.create({
            filename: req.file.filename, // Nombre original del archivo
            path: req.file.path, // Ruta local donde se guarda el archivo en el servidor
            url: url // URL pública del archivo generado
        });

        //await newFile.save(); // Guardar el archivo en la base de datos MongoDB

        // Devolver la URL pública del archivo subido como respuesta
        res.status(200).json({
            success: true,
            url: url
        })

    } catch (err) {
        // Manejar errores en caso de fallo al guardar el archivo en MongoDB
        console.error('Error al guardar el archivo en MongoDB:', err);
        res.status(500).json({
            success: false,

            error: err
        })

    }
});


// Iniciar el servidor Express y escuchar peticiones en el puerto especificado
app.listen(port, () => {
    console.log(`Servidor Express escuchando en http://localhost:${port}`);
});

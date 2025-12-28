require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB Atlas'))
  .catch(err => console.error('Error MongoDB:', err));

// Modelo (solo URLs y metadatos)
const libroSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  autor: { type: String, required: true },
  descripcion: String,
  genero: String,
  ano: Number,
  tipo: { type: String, enum: ['pdf', 'audio'], required: true },
  archivoUrl: { type: String, required: true },  // URL de OneDrive para PDF o audio
  imagenUrl: String,                             // URL de OneDrive para imagen (opcional)
  fecha: { type: Date, default: Date.now }
});

const Libro = mongoose.model('Libro', libroSchema);

// Añadir libro (recibe solo URLs)
app.post('/api/libros', async (req, res) => {
  try {
    const { titulo, autor, descripcion, genero, ano, tipo, archivoUrl, imagenUrl } = req.body;

    if (!archivoUrl) return res.status(400).json({ error: 'URL del archivo principal obligatoria' });

    const nuevoLibro = new Libro({
      titulo,
      autor,
      descripcion,
      genero,
      ano,
      tipo,
      archivoUrl,
      imagenUrl: imagenUrl || '',  // Opcional
    });

    await nuevoLibro.save();
    res.json(nuevoLibro);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar' });
  }
});

// Listar todos
app.get('/api/libros', async (req, res) => {
  const libros = await Libro.find().sort({ fecha: -1 });
  res.json(libros);
});

// Buscar por título, autor, descripción o género
app.get('/api/libros/buscar', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json(await Libro.find());
  const libros = await Libro.find({
    $or: [
      { titulo: { $regex: q, $options: 'i' } },
      { autor: { $regex: q, $options: 'i' } },
      { descripcion: { $regex: q, $options: 'i' } },
      { genero: { $regex: q, $options: 'i' } }
    ]
  });
  res.json(libros);
});

// Eliminar (solo borra de MongoDB)
app.delete('/api/libros/:id', async (req, res) => {
  try {
    await Libro.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Libro eliminado de la biblioteca' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));
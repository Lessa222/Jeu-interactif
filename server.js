const express = require('express');
const path = require('path');
const app = express();

// Définir le port
const PORT = 3000;

// 🔹 Indiquer à Express de servir le dossier "public" comme dossier statique
app.use(express.static(path.join(__dirname, 'public')));

// 🔹 Route principale (optionnelle — Express trouve index.html tout seul)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔹 Démarrer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000; // Porta padrão exigida na especificação

// Middlewares obrigatórios
app.use(cors()); // Habilita o CORS
app.use(express.json()); // Permite que a API receba e envie JSON

// Endpoint 3: Health Check
app.get('/api/v1/health', (req, res) => {
    // Retorno de sucesso (HTTP 200) conforme especificação
    return res.status(200).json({
        status: "healthy",
        versao: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

// Inicializa o servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando perfeitamente em http://localhost:${PORT}`);
    console.log(`⚙️  Health Check disponível em http://localhost:${PORT}/api/v1/health`);
});
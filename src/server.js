const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Importamos o axios para fazer as requisições externas

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Endpoint 3: Health Check (Já estava pronto)
app.get('/api/v1/health', (req, res) => {
    return res.status(200).json({
        status: "healthy",
        versao: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

// =========================================================================
// ENDPOINT 1: Informações da Cidade com Clima
// =========================================================================
app.get('/api/v1/clima/:nome_cidade', async (req, res) => {
    const { nome_cidade } = req.params;

    // REQUISITO DE ERRO 1: Validação de nome inválido (mínimo 2 caracteres)
    if (!nome_cidade || nome_cidade.trim().length < 2) {
        return res.status(400).json({
            erro: true,
            codigo: "NOME_INVALIDO",
            mensagem: "O nome da cidade deve conter pelo menos 2 caracteres",
            nome_informado: nome_cidade
        });
    }

    try {
        // ETAPA A: Chamar a API de Geocodificação do Open-Meteo para achar as coordenadas pelo nome
        const urlGeocodificacao = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome_cidade)}&count=1&language=pt`;
        const respostaGeo = await axios.get(urlGeocodificacao);

        // Se a API externa não trouxer resultados, significa que a cidade não existe
        if (!respostaGeo.data.results || respostaGeo.data.results.length === 0) {
            return res.status(404).json({
                erro: true,
                codigo: "CIDADE_NAO_ENCONTRADA",
                mensagem: "Nenhuma cidade encontrada com o nome informado",
                nome_informado: nome_cidade
            });
        }

        // Extraímos os dados geográficos da primeira cidade encontrada
        const cidadeDados = respostaGeo.data.results[0];
        const { name, admin1, latitude, longitude } = cidadeDados; 
        // Nota: 'admin1' costuma ser o estado ou região.

        // ETAPA B: Usar a latitude e longitude obtidas para consultar o clima atual
        // Vamos pedir a temperatura atual, a máxima e a mínima do dia
        const urlClima = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&current_weather=true&timezone=auto`;
        const respostaClima = await axios.get(urlClima);

        const climaDados = respostaClima.data;

        // ETAPA C: Montar e padronizar o JSON final exatamente como o professor pediu
        const respostaFinal = {
            nome: name,
            estado: admin1 || "N/A", // Se não vier o estado, coloca N/A para não quebrar
            clima: {
                temperatura_atual: climaDados.current_weather.temperature, // Adicional útil
                temperatura_min: climaDados.daily.temperature_2m_min[0],
                temperature_max: climaDados.daily.temperature_2m_max[0],
                condicao: "Informação via Open-Meteo", // Como varia por API, preenchemos um texto padrão informativo
                unidades: {
                    temperatura: "°C"
                }
            },
            consultado_em: new Date().toISOString()
        };

        // Retorna o sucesso (HTTP 200) com o JSON envelopado
        return res.status(200).json(respostaFinal);

    } catch (error) {
        // REQUISITO DE ERRO 3: Tratar se o serviço externo (Open-Meteo) cair ou falhar
        console.error("Erro na integração externa:", error.message);
        return res.status(503).json({
            erro: true,
            codigo: "SERVICO_EXTERNO_INDISPONIVEL",
            mensagem: "Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes",
            servico: "Open-Meteo"
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando perfeitamente em http://localhost:${PORT}`);
});
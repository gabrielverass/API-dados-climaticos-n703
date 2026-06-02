const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
    return res.status(200).json({
        status: "healthy",
        versao: "1.0.0",
        timestamp: new Date().toISOString()
    });
});

// Weather and Geocoding Integration Endpoint
app.get('/api/v1/clima/:nome_cidade', async (req, res) => {
    const { nome_cidade } = req.params;

    if (!nome_cidade || nome_cidade.trim().length < 2) {
        return res.status(400).json({
            erro: true,
            codigo: "NOME_INVALIDO",
            mensagem: "O nome da cidade deve conter pelo menos 2 caracteres",
            nome_informado: nome_cidade
        });
    }

    try {
        const urlGeo = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome_cidade)}&count=1&language=pt`;
        const respostaGeo = await axios.get(urlGeo);

        if (!respostaGeo.data.results || respostaGeo.data.results.length === 0) {
            return res.status(404).json({
                erro: true,
                codigo: "CIDADE_NAO_ENCONTRADA",
                mensagem: "Nenhuma cidade encontrada com o nome informado",
                nome_informado: nome_cidade
            });
        }

        const { name, admin1, latitude, longitude } = respostaGeo.data.results[0];

        const urlClima = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min&current_weather=true&timezone=auto`;
        const respostaClima = await axios.get(urlClima);
        const climaDados = respostaClima.data;

        return res.status(200).json({
            nome: name,
            estado: admin1 || "N/A",
            clima: {
                temperatura_atual: climaDados.current_weather.temperature,
                temperatura_min: climaDados.daily.temperature_2m_min[0],
                temperatura_max: climaDados.daily.temperature_2m_max[0],
                condicao: "Informação via Open-Meteo",
                unidades: {
                    temperatura: "°C"
                }
            },
            consultado_em: new Date().toISOString()
        });

    } catch (error) {
        console.error("Geocoding/Weather API Integration Error:", error.message);
        return res.status(503).json({
            erro: true,
            codigo: "SERVICO_EXTERNO_INDISPONIVEL",
            mensagem: "Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes",
            servico: "Open-Meteo"
        });
    }
});

// Municipalities List Endpoint
app.get('/api/v1/cidades/:sigla_uf', async (req, res) => {
    const { sigla_uf } = req.params;
    const limite = req.query.limite ? parseInt(req.query.limite) : 10;

    if (!sigla_uf || sigla_uf.trim().length !== 2) {
        return res.status(400).json({
            erro: true,
            codigo: "SIGLA_UF_INVALIDA",
            mensagem: "A sigla do estado deve conter exatamente 2 letras",
            sigla_uf_informada: sigla_uf
        });
    }

    if (isNaN(limite) || limite < 1 || limite > 100) {
        return res.status(400).json({
            erro: true,
            codigo: "LIMITE_INVALIDO",
            mensagem: "O parâmetro limite deve ser um número entre 1 and 100",
            limite_informado: req.query.limite
        });
    }

    try {
        const urlCidades = `https://brasilapi.com.br/api/ibge/municipios/v1/${sigla_uf.toUpperCase()}?providers=dados-abertos-br`;
        const respostaBrasilApi = await axios.get(urlCidades);
        
        const cidadesLimitadas = respostaBrasilApi.data
            .map(cidade => ({ nome: cidade.nome }))
            .slice(0, limite);

        return res.status(200).json({
            uf: sigla_uf.toUpperCase(),
            quantidade_retornada: cidadesLimitadas.length,
            cidades: cidadesLimitadas,
            consultado_em: new Date().toISOString()
        });

    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(404).json({
                erro: true,
                codigo: "UF_NAO_ENCONTRADA",
                mensagem: "Estado com a sigla informada não foi encontrado",
                sigla_uf_informada: sigla_uf
            });
        }

        console.error("Brasil API Integration Error:", error.message);
        return res.status(503).json({
            erro: true,
            codigo: "SERVICO_EXTERNO_INDISPONIVEL",
            mensagem: "Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes",
            servico: "Brasil API"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
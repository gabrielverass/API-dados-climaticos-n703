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
// =========================================================================
// ENDPOINT 2: Listagem de Cidades por Estado
// =========================================================================
app.get('/api/v1/cidades/:sigla_uf', async (req, res) => {
    const { sigla_uf } = req.params;
    // Captura o query parameter 'limite'. Se não for informado, adota 10 como padrão.
    const limite = req.query.limite ? parseInt(req.query.limite) : 10;

    // REQUISITO DE ERRO 1: Validação de sigla inválida (deve ter exatamente 2 caracteres)
    if (!sigla_uf || sigla_uf.trim().length !== 2) {
        return res.status(400).json({
            erro: true,
            codigo: "SIGLA_UF_INVALIDA",
            mensagem: "A sigla do estado deve conter exatamente 2 letras",
            sigla_uf_informada: sigla_uf
        });
    }

    // Validação extra de segurança: Garante que o limite seja um número válido entre 1 e 100
    if (isNaN(limite) || limite < 1 || limite > 100) {
        return res.status(400).json({
            erro: true,
            codigo: "LIMITE_INVALIDO",
            mensagem: "O parâmetro limite deve ser um número entre 1 e 100",
            limite_informado: req.query.limite
        });
    }

    try {
        // Consultando a Brasil API buscando os municípios do estado informado
        const urlCidades = `https://brasilapi.com.br/api/ibge/municipios/v1/${sigla_uf.toUpperCase()}?providers=dados-abertos-br`;
        const respostaBrasilApi = await axios.get(urlCidades);

        const todasAsCidades = respostaBrasilApi.data;

        // Mapeamos o array que veio da API externa para retornar apenas o nome do município
        const cidadesFormatadas = todasAsCidades.map(cidade => ({
            nome: cidade.nome
        }));

        // Cortamos o array usando o .slice() com base no limite definido (padrão 10 ou informado pelo usuário)
        const cidadesLimitadas = cidadesFormatadas.slice(0, limite);

        // Montamos a estrutura exata exigida pelo PDF
        const respostaFinal = {
            uf: sigla_uf.toUpperCase(),
            quantidade_retornada: cidadesLimitadas.length,
            cidades: cidadesLimitadas,
            consultado_em: new Date().toISOString()
        };

        // Retorna sucesso HTTP 200
        return res.status(200).json(respostaFinal);

    } catch (error) {
        // Se a Brasil API retornar erro 404 ou 400 por causa da UF inexistente
        if (error.response && error.response.status === 404) {
            return res.status(404).json({
                erro: true,
                codigo: "UF_NAO_ENCONTRADA",
                mensagem: "Estado com a sigla informada não foi encontrado",
                sigla_uf_informada: sigla_uf
            });
        }

        // REQUISITO DE ERRO 3: Tratar se o serviço externo cair ou falhar (HTTP 503)
        console.error("Erro na integração com Brasil API:", error.message);
        return res.status(503).json({
            erro: true,
            codigo: "SERVICO_EXTERNO_INDISPONIVEL",
            mensagem: "Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes",
            servico: "Brasil API"
        });
    }
});
# API de Dados Climáticos e Geográficos – N703

Projeto desenvolvido para a disciplina Técnicas de Integração de Sistemas (N703).
A aplicação fornece uma API REST de agregação de dados climáticos e geográficos, consumindo APIs públicas externas para retornar informações padronizadas sobre cidades brasileiras.

## Objetivo
O objetivo deste projeto é integrar APIs públicas externas para disponibilizar:
* Informações geográficas de cidades brasileiras
* Dados climáticos atualizados
* Listagem de cidades por estado
* Tratamento padronizado de erros
* Testes automatizados

## Tecnologias Utilizadas
* Node.js
* Express
* Axios
* CORS
* APIs públicas: Brasil API / IBGE e Open-Meteo

## Estrutura do Projeto
API-dados-climaticos-n703/
├── README.md
├── INTEGRANTES.md
├── package.json
├── src/
│   └── server.js
├── tests/
│   ├── clima_sucesso.test.js
│   └── clima_erro.test.js
└── docs/
└── postman_collection.json
## Como executar

1. **Clonar o repositório:**
```bash
   git clone [https://github.com/gabrielverass/API-dados-climaticos-n703.git](https://github.com/gabrielverass/API-dados-climaticos-n703.git)
Acessar a pasta:Bash   cd API-dados-climaticos-n703
Instalar dependências:Bash   npm install
Iniciar o servidor em modo desenvolvimento:Bash   npm run dev
Servidor disponível em: http://localhost:3000  Endpoints1. Health CheckGET /api/v1/health  Verifica se a API está funcionando corretamente.  Exemplo de resposta (HTTP 200):  JSON{
  "status": "healthy",
  "versao": "1.0.0",
  "timestamp": "2026-06-01T14:30:00Z"
}
2. Clima por cidadeGET /api/v1/clima/{nome_cidade}  Busca dados geográficos e climáticos de uma cidade brasileira.  Exemplo de requisição:  GET /api/v1/clima/Fortaleza  Resposta de Sucesso (HTTP 200):  JSON{
  "nome": "Fortaleza",
  "estado": "Ceará",
  "clima": {
    "temperatura_atual": 24.9,
    "temperatura_min": 24.6,
    "temperatura_max": 30.2,
    "condicao": "Informação via Open-Meteo",
    "unidades": {
      "temperatura": "°C"
    }
  },
  "consultado_em": "2026-06-01T14:30:00Z"
}
Erro 400 – nome inválido:  JSON{
  "erro": true,
  "codigo": "NOME_INVALIDO",
  "mensagem": "O nome da cidade deve conter pelo menos 2 caracteres",
  "nome_informado": "F"
}
Erro 404 – cidade não encontrada:  JSON{
  "erro": true,
  "codigo": "CIDADE_NAO_ENCONTRADA",
  "mensagem": "Nenhuma cidade encontrada com o nome informado",
  "nome_informado": "CidadeInexistente"
}
Erro 503 – serviço externo indisponível:  JSON{
  "erro": true,
  "codigo": "SERVICO_EXTERNO_INDISPONIVEL",
  "mensagem": "Não foi possível obter dados do serviço externo. Tente novamente em alguns instantes",
  "servico": "Open-Meteo"
}
3. Listagem de cidades por estadoGET /api/v1/cidades/{sigla_uf}  Retorna lista de cidades do estado informado.  Exemplo de requisição:  GET /api/v1/cidades/CE?limite=5  Resposta de Sucesso (HTTP 200):  JSON{
  "uf": "CE",
  "quantidade_retornada": 5,
  "cidades": [
    { "nome": "Abaiara" },
    { "nome": "Acarape" },
    { "nome": "Acaraú" },
    { "nome": "Acopiara" },
    { "nome": "Aiuaba" }
  ],
  "consultado_em": "2026-06-01T14:30:00Z"
}
🧪 Testes automatizadosPara executar os testes automatizados de integração, certifique-se de que o servidor está rodando em um terminal e execute o comando abaixo em outro terminal
:Bash
node --test tests/
Testes implementados:  
- Resposta correta para cidade válida  
- Tratamento de erro para cidade não encontrada

📂 Coleção Postman
Arquivo disponível em: docs/postman_collection.json
Importe no Postman para testar rapidamente todos os endpoints

.👥 IntegrantesConsultar o arquivo: INTEGRANTES.md

📌 Observações Gerais
- Todas as respostas são em JSON
- API executa na porta 3000
- UTF-8 habilitado
CORS habilitado
Dados climáticos obtidos dinamicamente via APIs públicas

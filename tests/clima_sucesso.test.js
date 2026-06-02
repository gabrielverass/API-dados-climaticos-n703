const test = require('node:test');
const assert = require('node:assert');
const axios = require('axios');

test('Deve retornar dados climaticos com sucesso para cidade valida (HTTP 200)', async () => {
    // Nota: O servidor precisa estar rodando (npm run dev) para o teste passar
    try {
        const resposta = await axios.get('http://localhost:3000/api/v1/clima/Fortaleza');
        
        assert.strictEqual(resposta.status, 200);
        assert.strictEqual(resposta.data.nome, 'Fortaleza');
        assert.ok(resposta.data.clima);
        assert.ok(resposta.data.clima.temperatura_atual);
    } catch (error) {
        assert.fail(`A requisicao falhou: ${error.message}`);
    }
});
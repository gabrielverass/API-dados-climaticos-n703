const test = require('node:test');
const assert = require('node:assert');
const axios = require('axios');

test('Deve retornar erro 404 para cidade inexistente', async () => {
    try {
        await axios.get('http://localhost:3000/api/v1/clima/CidadeInexistenteDeTeste');
        assert.fail('A requisicao deveria ter falhado com 404, mas retornou sucesso.');
    } catch (error) {
        assert.strictEqual(error.response.status, 404);
        assert.strictEqual(error.response.data.codigo, 'CIDADE_NAO_ENCONTRADA');
        assert.strictEqual(error.response.data.erro, true);
    }
});
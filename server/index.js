const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Armazenamento temporário em memória.
// Os dados serão apagados quando o servidor reiniciar.
const participantes = [];
const curtidas = new Set();

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Servidor Deu Match funcionando! 💘',
  });
});

app.get('/api/participantes', (req, res) => {
  const { excluirId } = req.query;
  const resultado = excluirId
    ? participantes.filter((pessoa) => pessoa.id !== excluirId)
    : participantes;

  res.json(resultado);
});

function validarDadosPerfil(body) {
  const { nome, idade, genero, procura, foto } = body;

  if (typeof nome !== 'string' || !nome.trim() || nome.trim().length > 30) {
    return 'Informe um nome ou apelido de até 30 caracteres.';
  }

  if (
    idade === undefined ||
    idade === null ||
    String(idade).trim() === '' ||
    !Number.isInteger(Number(idade)) ||
    Number(idade) < 18 ||
    Number(idade) > 120
  ) {
    return 'A idade deve ser um número entre 18 e 120.';
  }

  if (!['Mulher', 'Homem', 'Outro', 'Prefiro não informar'].includes(genero)) {
    return 'Selecione um gênero válido.';
  }

  if (!['Relacionamento', 'Algo casual', 'Conhecer pessoas'].includes(procura)) {
    return 'Selecione o que você procura.';
  }

  if (
    foto !== undefined &&
    foto !== '' &&
    (typeof foto !== 'string' || !foto.startsWith('data:image/'))
  ) {
    return 'A foto enviada não é válida.';
  }

  return null;
}

function normalizarDadosPerfil(body) {
  return {
    nome: body.nome.trim(),
    idade: Number(body.idade),
    genero: body.genero,
    procura: body.procura,
    foto: body.foto || '',
  };
}

app.post('/api/participantes', (req, res) => {
  const erro = validarDadosPerfil(req.body);
  if (erro) return res.status(400).json({ erro });

  const novoParticipante = {
    id: randomUUID(),
    ...normalizarDadosPerfil(req.body),
  };

  participantes.push(novoParticipante);
  res.status(201).json(novoParticipante);
});

// Exclui um perfil e remove todas as curtidas relacionadas a ele.
app.delete('/api/participantes/:id', (req, res) => {
  const { id } = req.params;
  const indice = participantes.findIndex((pessoa) => pessoa.id === id);

  if (indice === -1) {
    return res.status(404).json({ erro: 'Perfil não encontrado.' });
  }

  participantes.splice(indice, 1);

  for (const chave of [...curtidas]) {
    const [deId, paraId] = chave.split(':');
    if (deId === id || paraId === id) {
      curtidas.delete(chave);
    }
  }

  res.json({ ok: true });
});

// Atualiza o perfil existente e preserva o mesmo ID.
app.put('/api/participantes/:id', (req, res) => {
  const { id } = req.params;
  const indice = participantes.findIndex((pessoa) => pessoa.id === id);

  if (indice === -1) {
    return res.status(404).json({
      erro: 'Perfil não encontrado. Ele pode ter sido apagado após uma reinicialização do servidor.',
    });
  }

  const erro = validarDadosPerfil(req.body);
  if (erro) return res.status(400).json({ erro });

  participantes[indice] = {
    id,
    ...normalizarDadosPerfil(req.body),
  };

  res.json(participantes[indice]);
});

app.get('/api/curtidas', (req, res) => {
  const { deId } = req.query;

  if (!deId || !participantes.some((pessoa) => pessoa.id === deId)) {
    return res.status(400).json({ erro: 'Participante não identificado.' });
  }

  const prefixo = `${deId}:`;
  const curtidos = [...curtidas]
    .filter((chave) => chave.startsWith(prefixo))
    .map((chave) => chave.slice(prefixo.length));

  res.json({ curtidos });
});

app.post('/api/curtidas', (req, res) => {
  const { deId, paraId } = req.body;

  if (!deId || !paraId || deId === paraId) {
    return res.status(400).json({ erro: 'Curtida inválida.' });
  }

  const remetente = participantes.find((pessoa) => pessoa.id === deId);
  const destinatario = participantes.find((pessoa) => pessoa.id === paraId);

  if (!remetente || !destinatario) {
    return res.status(404).json({ erro: 'Participante não encontrado.' });
  }

  curtidas.add(`${deId}:${paraId}`);
  const match = curtidas.has(`${paraId}:${deId}`);

  res.status(201).json({
    ok: true,
    match,
    nome: match ? destinatario.nome : undefined,
  });
});

app.delete('/api/curtidas', (req, res) => {
  const { deId, paraId } = req.body;

  if (!deId || !paraId) {
    return res.status(400).json({ erro: 'Dados da curtida incompletos.' });
  }

  curtidas.delete(`${deId}:${paraId}`);
  res.json({ ok: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Deu Match rodando na porta ${PORT}`);
});

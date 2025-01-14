const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'sistema_merito',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ mensagem: 'Erro interno do servidor' });
});

// Rota para inicializar instituições
app.get('/init-instituicoes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM instituicoes');
    if (rows.length === 0) {
      await pool.query(`
        INSERT INTO instituicoes (nome) VALUES 
        ('Universidade A'),
        ('Universidade B'),
        ('Universidade C')
      `);
      res.json({ mensagem: 'Instituições inicializadas com sucesso' });
    } else {
      res.json({ mensagem: 'Instituições já existem' });
    }
  } catch (error) {
    console.error('Erro ao inicializar instituições:', error);
    res.status(500).json({ mensagem: 'Erro ao inicializar instituições' });
  }
});

// Rota para listar instituições
app.get('/instituicoes', async (req, res) => {
  try {
    const [instituicoes] = await pool.query('SELECT id, nome FROM instituicoes');
    res.json(instituicoes);
  } catch (error) {
    console.error('Erro ao listar instituições:', error);
    res.status(500).json({ mensagem: 'Erro ao listar instituições' });
  }
});


// Rota de login
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(400).json({ mensagem: 'Usuário não encontrado' });
    }

    const usuario = rows[0];

    if (await bcrypt.compare(senha, usuario.senha)) {
      res.json({ id: usuario.id, tipo: usuario.tipo });
    } else {
      res.status(400).json({ mensagem: 'Senha incorreta' });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ mensagem: 'Erro no servidor' });
  }
});

// Rota para cadastro de aluno
app.post('/cadastro/aluno', async (req, res) => {
  const { nome, email, senha, cpf, rg, endereco, instituicao_id, curso } = req.body;

  if (!nome || !email || !senha || !cpf || !rg || !endereco || !instituicao_id || !curso) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verificar se a instituição existe
    const [instituicao] = await connection.query('SELECT id FROM instituicoes WHERE id = ?', [instituicao_id]);
    if (instituicao.length === 0) {
      throw new Error('Instituição não encontrada');
    }

    const hashedSenha = await bcrypt.hash(senha, 10);

    const [result] = await connection.query(
      'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
      [nome, email, hashedSenha, 'aluno']
    );

    const usuario_id = result.insertId;

    await connection.query(
      'INSERT INTO alunos (usuario_id, cpf, rg, endereco, instituicao_id, curso, saldo_moedas) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [usuario_id, cpf, rg, endereco, instituicao_id, curso, 0]
    );

    await connection.commit();
    res.status(201).json({ mensagem: 'Aluno cadastrado com sucesso' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Erro no cadastro do aluno:', error);
    if (error.message === 'Instituição não encontrada') {
      res.status(400).json({ mensagem: 'Instituição não encontrada. Por favor, selecione uma instituição válida.' });
    } else {
      res.status(500).json({ mensagem: 'Erro no cadastro do aluno', erro: error.message });
    }
  } finally {
    if (connection) connection.release();
  }
});

// Rota para cadastro de professor
app.post('/cadastro/professor', async (req, res) => {
  const { nome, email, senha, cpf, instituicao_id, departamento } = req.body;

  if (!nome || !email || !senha || !cpf || !instituicao_id || !departamento) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verificar se a instituição existe
    const [instituicao] = await connection.query('SELECT id FROM instituicoes WHERE id = ?', [instituicao_id]);
    if (instituicao.length === 0) {
      throw new Error('Instituição não encontrada');
    }

    const hashedSenha = await bcrypt.hash(senha, 10);

    const [result] = await connection.query(
      'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
      [nome, email, hashedSenha, 'professor']
    );

    const usuario_id = result.insertId;

    await connection.query(
      'INSERT INTO professores (usuario_id, cpf, instituicao_id, departamento, saldo_moedas) VALUES (?, ?, ?, ?, ?)',
      [usuario_id, cpf, instituicao_id, departamento, 1000]
    );

    await connection.commit();
    res.status(201).json({ mensagem: 'Professor cadastrado com sucesso' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Erro no cadastro do professor:', error);
    if (error.message === 'Instituição não encontrada') {
      res.status(400).json({ mensagem: 'Instituição não encontrada. Por favor, selecione uma instituição válida.' });
    } else {
      res.status(500).json({ mensagem: 'Erro no cadastro do professor', erro: error.message });
    }
  } finally {
    if (connection) connection.release();
  }
});

// Rota para cadastro de empresa
app.post('/cadastro/empresa', async (req, res) => {
  const { nome, email, senha } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const hashedSenha = await bcrypt.hash(senha, 10);

    const [result] = await connection.query(
      'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
      [nome, email, hashedSenha, 'empresa']
    );

    const usuario_id = result.insertId;

    await connection.query('INSERT INTO empresas (usuario_id) VALUES (?)', [usuario_id]);

    await connection.commit();
    res.status(201).json({ mensagem: 'Empresa cadastrada com sucesso' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Erro no cadastro da empresa:', error);
    res.status(500).json({ mensagem: 'Erro no cadastro da empresa' });
  } finally {
    if (connection) connection.release();
  }
});

// Rota para enviar moedas (professor para aluno)
app.post('/enviar-moedas', async (req, res) => {
  const { professor_id, aluno_id, quantidade, motivo } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [professor] = await connection.query('SELECT saldo_moedas FROM professores WHERE usuario_id = ?', [professor_id]);

    if (professor[0].saldo_moedas < quantidade) {
      await connection.rollback();
      return res.status(400).json({ mensagem: 'Saldo insuficiente' });
    }

    await connection.query('UPDATE professores SET saldo_moedas = saldo_moedas - ? WHERE usuario_id = ?', [quantidade, professor_id]);
    await connection.query('UPDATE alunos SET saldo_moedas = saldo_moedas + ? WHERE usuario_id = ?', [quantidade, aluno_id]);

    await connection.query(
      'INSERT INTO transacoes (remetente_id, destinatario_id, quantidade_moedas, motivo) VALUES (?, ?, ?, ?)',
      [professor_id, aluno_id, quantidade, motivo]
    );

    await connection.commit();
    res.json({ mensagem: 'Moedas enviadas com sucesso' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Erro ao enviar moedas:', error);
    res.status(500).json({ mensagem: 'Erro ao enviar moedas' });
  } finally {
    if (connection) connection.release();
  }
});

// Rota para consultar extrato
app.get('/extrato/:usuario_id', async (req, res) => {
  const usuario_id = req.params.usuario_id;

  try {
    const [usuario] = await pool.query('SELECT tipo FROM usuarios WHERE id = ?', [usuario_id]);
    
    if (usuario.length === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado' });
    }

    let saldo, transacoes;

    if (usuario[0].tipo === 'aluno') {
      [saldo] = await pool.query('SELECT saldo_moedas FROM alunos WHERE usuario_id = ?', [usuario_id]);
      [transacoes] = await pool.query('SELECT * FROM transacoes WHERE destinatario_id = ? OR remetente_id = ?', [usuario_id, usuario_id]);
    } else if (usuario[0].tipo === 'professor') {
      [saldo] = await pool.query('SELECT saldo_moedas FROM professores WHERE usuario_id = ?', [usuario_id]);
      [transacoes] = await pool.query('SELECT * FROM transacoes WHERE remetente_id = ?', [usuario_id]);
    } else {
      return res.status(400).json({ mensagem: 'Tipo de usuário inválido' });
    }

    res.json({ saldo: saldo[0].saldo_moedas, transacoes });
  } catch (error) {
    console.error('Erro ao consultar extrato:', error);
    res.status(500).json({ mensagem: 'Erro ao consultar extrato' });
  }
});

// Rota para cadastrar vantagem (empresa)
app.post('/cadastrar-vantagem', async (req, res) => {
  const { empresa_id, nome, descricao, custo_moedas, foto_url } = req.body;

  if (!empresa_id || !nome || !descricao || !custo_moedas || !foto_url) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verificar se a empresa existe
    const [empresa] = await connection.query('SELECT id FROM empresas WHERE usuario_id = ?', [empresa_id]);
    if (empresa.length === 0) {
      throw new Error('Empresa não encontrada');
    }

    const [result] = await connection.query(
      'INSERT INTO vantagens (empresa_id, nome, descricao, custo_moedas, foto_url) VALUES (?, ?, ?, ?, ?)',
      [empresa[0].id, nome, descricao, custo_moedas, foto_url]
    );

    await connection.commit();
    res.status(201).json({ mensagem: 'Vantagem cadastrada com sucesso', id: result.insertId });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Erro ao cadastrar vantagem:', error);
    res.status(500).json({ mensagem: 'Erro ao cadastrar vantagem', erro: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Rota para listar vantagens disponíveis
app.get('/vantagens', async (req, res) => {
  try {
    const [vantagens] = await pool.query('SELECT * FROM vantagens');
    res.json(vantagens);
  } catch (error) {
    console.error('Erro ao listar vantagens:', error);
    res.status(500).json({ mensagem: 'Erro ao listar vantagens' });
  }
});

// Rota para resgatar vantagem
app.post('/resgatar-vantagem', async (req, res) => {
  const { aluno_id, vantagem_id } = req.body;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // First, get the aluno's id from the alunos table
    const [alunoRows] = await connection.query('SELECT id FROM alunos WHERE usuario_id = ?', [aluno_id]);
    if (alunoRows.length === 0) {
      throw new Error('Aluno não encontrado');
    }
    const alunoRealId = alunoRows[0].id;

    const [vantagem] = await connection.query('SELECT * FROM vantagens WHERE id = ?', [vantagem_id]);
    if (vantagem.length === 0) {
      throw new Error('Vantagem não encontrada');
    }

    const [aluno] = await connection.query('SELECT saldo_moedas FROM alunos WHERE id = ?', [alunoRealId]);

    if (aluno[0].saldo_moedas < vantagem[0].custo_moedas) {
      throw new Error('Saldo insuficiente');
    }

    const codigo_cupom = Math.random().toString(36).substring(7);

    await connection.query('UPDATE alunos SET saldo_moedas = saldo_moedas - ? WHERE id = ?', [vantagem[0].custo_moedas, alunoRealId]);
    await connection.query('INSERT INTO resgates (aluno_id, vantagem_id, codigo_cupom) VALUES (?, ?, ?)', [alunoRealId, vantagem_id, codigo_cupom]);

    await connection.commit();
    res.json({ mensagem: 'Vantagem resgatada com sucesso', codigo_cupom });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Erro ao resgatar vantagem:', error);
    res.status(400).json({ mensagem: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Rota para listar alunos (para o professor selecionar ao enviar moedas)
app.get('/alunos', async (req, res) => {
  try {
    const [alunos] = await pool.query('SELECT u.id, u.nome FROM usuarios u JOIN alunos a ON u.id = a.usuario_id');
    res.json(alunos);
  } catch (error) {
    console.error('Erro ao listar alunos:', error);
    res.status(500).json({ mensagem: 'Erro ao listar alunos' });
  }
});

// Rota para servir o arquivo HTML principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
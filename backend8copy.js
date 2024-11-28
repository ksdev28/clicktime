const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Sequelize, DataTypes } = require("sequelize");
const sendgrid = require("@sendgrid/mail");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

require("dotenv").config(); // Carrega variáveis de ambiente do arquivo .env

// Middleware para verificar o token JWT
function verificarToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) {
    return res
      .status(403)
      .json({ error: "Token de autenticação não fornecido." });
  }

  const tokenSemBearer = token.replace("Bearer ", "");
  jwt.verify(tokenSemBearer, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Token inválido." });
    }

    req.usuario = decoded; // Passa o usuário decodificado para as próximas rotas
    next();
  });
}

// Configuração do Sequelize e PostgreSQL
const sequelize = new Sequelize("click_data", "postgres", "root", {
  host: "localhost",
  port: 5434,
  dialect: "postgres",
});

// Modelos
const Empresa = sequelize.define("Empresa", {
  nome_empresa: { type: DataTypes.STRING, allowNull: false },
});

const Profissional = sequelize.define("Profissional", {
  nome: { type: DataTypes.STRING, allowNull: false },
  empresa_id: {
    type: DataTypes.INTEGER,
    references: { model: Empresa, key: "id" },
    allowNull: false, // A empresa agora é obrigatória
  },
});

const Servico = sequelize.define("Servico", {
  nome: { type: DataTypes.STRING, allowNull: false },
  descricao: { type: DataTypes.TEXT, allowNull: true },
});

const Usuario = sequelize.define("Usuario", {
  nome: { type: DataTypes.STRING, allowNull: false },
  sobrenome: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  senha: { type: DataTypes.STRING, allowNull: false },
  empresa_id: {
    type: DataTypes.INTEGER,
    references: { model: Empresa, key: "id" },
    allowNull: true,
  },
});

const EmpresaEscolhida = sequelize.define("EmpresaEscolhida", {
  usuario_id: {
    type: DataTypes.INTEGER,
    references: { model: Usuario, key: "id" },
    allowNull: false,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    references: { model: Empresa, key: "id" },
    allowNull: false,
  },
});

const ProfissionalServicos = sequelize.define("ProfissionalServicos", {
  usuario_id: {
    type: DataTypes.INTEGER,
    references: { model: Usuario, key: "id" },
    allowNull: false,
  },
  profissional_id: {
    type: DataTypes.INTEGER,
    references: { model: Profissional, key: "id" },
    allowNull: false,
  },
  servico_id: {
    type: DataTypes.INTEGER,
    references: { model: Servico, key: "id" },
    allowNull: false,
  },
  empresa_id: {
    type: DataTypes.INTEGER,
    references: { model: Empresa, key: "id" },
    allowNull: false,
  },
});

// Configuração do SendGrid
sendgrid.setApiKey(process.env.SENDGRID_API_KEY); // Configuração da chave da API do SendGrid

// Função para enviar o e-mail de confirmação
function enviarEmailConfirmacao(clienteEmail, data, horario) {
  const msg = {
    to: clienteEmail, // E-mail do cliente
    from: process.env.SENDGRID_EMAIL, // Seu e-mail do SendGrid
    subject: "Confirmação de Agendamento", // Assunto do e-mail
    text: `Olá! Seu agendamento foi confirmado para o dia ${data} às ${horario}. Aguardamos sua presença!`, // Corpo do e-mail
  };

  sendgrid
    .send(msg)
    .then(() => {
      console.log("E-mail enviado com sucesso.");
    })
    .catch((error) => {
      console.error("Erro ao enviar e-mail:", error);
    });
}

// Inicialização do Express
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Endpoint para cadastrar um usuário
app.post("/usuario", async (req, res) => {
  const { nome, sobrenome, email, senha } = req.body;

  if (!nome || !sobrenome || !email || !senha) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  try {
    // Criptografar a senha antes de salvar
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar o usuário no banco de dados
    const usuario = await Usuario.create({
      nome,
      sobrenome,
      email,
      senha: senhaHash, // Armazenar senha criptografada
    });

    // Gerar o token JWT
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET, // Defina um segredo seguro para assinar o token
      { expiresIn: "1h" } // O token vai expirar após 1 hora
    );

    res.status(201).json({
      message: "Usuário cadastrado com sucesso!",
      token, // Retorna o token gerado
      usuario, // Retorna as informações do usuário
    });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }
    res.status(500).json({ error: "Erro ao cadastrar usuário." });
  }
});

// Endpoint para cadastrar um profissional com vinculação à empresa
app.post("/profissionais", async (req, res) => {
  const { nome, empresa_id } = req.body;

  if (!nome || !empresa_id) {
    return res.status(400).json({ error: "Nome e empresa são obrigatórios." });
  }

  try {
    // Verificar se a empresa existe antes de criar o profissional
    const empresa = await Empresa.findByPk(empresa_id);
    if (!empresa) {
      return res.status(404).json({ error: "Empresa não encontrada." });
    }

    // Criar o profissional no banco de dados e vincular à empresa
    const profissional = await Profissional.create({
      nome,
      empresa_id,
    });

    res.status(201).json({
      message: "Profissional cadastrado com sucesso!",
      profissional, // Retorna o profissional com a empresa associada
    });
  } catch (error) {
    console.error("Erro ao cadastrar profissional:", error);
    res.status(500).json({ error: "Erro ao cadastrar profissional." });
  }
});

// Endpoint para cadastrar uma empresa
app.post("/empresa", async (req, res) => {
  const { nome_empresa } = req.body;

  if (!nome_empresa) {
    return res.status(400).json({ error: "Nome da empresa é obrigatório." });
  }

  try {
    // Criar a empresa no banco de dados
    const empresa = await Empresa.create({
      nome_empresa,
    });

    res.status(201).json({
      message: "Empresa cadastrada com sucesso!",
      empresa, // Retorna as informações da empresa cadastrada
    });
  } catch (error) {
    console.error("Erro ao cadastrar empresa:", error);
    res.status(500).json({ error: "Erro ao cadastrar empresa." });
  }
});

// Endpoint para listar todas as empresas
app.get("/empresa", async (req, res) => {
  try {
    // Buscar todas as empresas no banco de dados
    const empresas = await Empresa.findAll();

    if (empresas.length === 0) {
      return res.status(404).json({ error: "Nenhuma empresa encontrada." });
    }

    res.status(200).json(empresas);
  } catch (error) {
    console.error("Erro ao listar empresas:", error);
    res.status(500).json({ error: "Erro ao listar empresas." });
  }
});

// Endpoint para salvar a empresa escolhida
app.post("/empresa-escolhida", async (req, res) => {
  const { usuarioId, empresaId } = req.body;

  if (!usuarioId || !empresaId) {
    return res.status(400).json({ error: "Usuário ou empresa inválidos" });
  }

  try {
    // Verificar se o usuário existe antes de associar a empresa
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // Verificar se a empresa existe antes de associar
    const empresa = await Empresa.findByPk(empresaId);
    if (!empresa) {
      return res.status(404).json({ error: "Empresa não encontrada." });
    }

    // Criar a associação entre o usuário e a empresa
    await EmpresaEscolhida.create({
      usuario_id: usuarioId,
      empresa_id: empresaId,
    });

    res.status(200).json({ message: "Empresa escolhida salva com sucesso" });
  } catch (error) {
    console.error("Erro ao salvar empresa escolhida:", error);
    res.status(500).json({
      error: "Erro ao salvar empresa escolhida",
      message: error.message,
      stack: error.stack,
    });
  }
});

// Endpoint para cadastrar um serviço
app.post("/servico", async (req, res) => {
  const { nome, descricao, empresa_id } = req.body;

  if (!nome || !descricao || !empresa_id) {
    return res
      .status(400)
      .json({ error: "Nome, descrição e empresa_id são obrigatórios." });
  }

  try {
    // Verificar se a empresa existe
    const empresa = await Empresa.findByPk(empresa_id);
    if (!empresa) {
      return res.status(404).json({ error: "Empresa não encontrada." });
    }

    // Criar o serviço no banco de dados
    const servico = await Servico.create({
      nome,
      descricao,
      empresa_id, // Vincula o serviço à empresa
    });

    res.status(201).json({
      message: "Serviço cadastrado com sucesso!",
      servico, // Retorna o serviço cadastrado
    });
  } catch (error) {
    console.error("Erro ao cadastrar serviço:", error);
    res.status(500).json({ error: "Erro ao cadastrar serviço." });
  }
});

// Endpoint para salvar a associação de profissional, serviço e empresa escolhidos
app.post("/profissional-servico", verificarToken, async (req, res) => {
  const { usuarioId, profissionalId, servicoId, empresaId } = req.body;

  if (!usuarioId || !profissionalId || !servicoId || !empresaId) {
    return res.status(400).json({
      error: "Usuário, profissional, serviço e empresa são obrigatórios",
    });
  }

  try {
    // Verificar se o usuário existe
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    // Verificar se o profissional existe
    const profissional = await Profissional.findByPk(profissionalId);
    if (!profissional) {
      return res.status(404).json({ error: "Profissional não encontrado." });
    }

    // Verificar se o serviço existe
    const servico = await Servico.findByPk(servicoId);
    if (!servico) {
      return res.status(404).json({ error: "Serviço não encontrado." });
    }

    // Verificar se a empresa existe
    const empresa = await Empresa.findByPk(empresaId);
    if (!empresa) {
      return res.status(404).json({ error: "Empresa não encontrada." });
    }

    // Criar a associação de profissional, serviço e empresa
    await ProfissionalServicos.create({
      usuario_id: usuarioId,
      profissional_id: profissionalId,
      servico_id: servicoId,
      empresa_id: empresaId,
    });

    res.status(200).json({ message: "Serviço agendado com sucesso" });
  } catch (error) {
    console.error("Erro ao agendar serviço:", error);
    res.status(500).json({
      error: "Erro ao agendar serviço",
      message: error.message,
      stack: error.stack,
    });
  }
});

// Inicializar a aplicação
app.listen(4000, async () => {
  try {
    await sequelize.sync({}); // Sincronizar os modelos com o banco de dados
    console.log("Servidor rodando na porta 4000.");
  } catch (error) {
    console.error("Erro ao inicializar o banco de dados:", error);
  }
});

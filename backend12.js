/**
 * Backend simples em Node.js para salvar dados no PostgreSQL.
 * Este código usa Express e Sequelize para gerenciar rotas e banco de dados.
 */
/*
const express = require("express");
const bodyParser = require("body-parser");
const { Sequelize, DataTypes } = require("sequelize");

// Configuração do Sequelize e PostgreSQL
const sequelize = new Sequelize("click_data", "postgres", "root", {
  host: "localhost",
  port: 5434,
  dialect: "postgres",
});

/**
 * Modelos (Definição das tabelas do banco de dados)


// Tabela de Usuários
const Usuario = sequelize.define("Usuario", {
  nome: { type: DataTypes.STRING, allowNull: false },
  sobrenome: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  numero: { type: DataTypes.STRING, allowNull: false },
});

// Tabela de Empresas
const Empresa = sequelize.define("Empresa", {
  nome_empresa: { type: DataTypes.STRING, allowNull: false },
});

// Tabela de Profissionais e Serviços
const ProfissionalServico = sequelize.define("ProfissionalServico", {
  profissional: { type: DataTypes.STRING, allowNull: false },
  servico: { type: DataTypes.STRING, allowNull: false },
});

// Tabela de Agendamentos
const Agendamento = sequelize.define("Agendamento", {
  data: { type: DataTypes.DATEONLY, allowNull: false },
  horario: { type: DataTypes.TIME, allowNull: false },
});

/**
 * Relacionamentos entre tabelas
 
Agendamento.belongsTo(Usuario, { foreignKey: "usuarioId" });
Agendamento.belongsTo(Empresa, { foreignKey: "empresaId" });
Agendamento.belongsTo(ProfissionalServico, {
  foreignKey: "profissionalServicoId",
});

// Inicialização do Express
const app = express();
app.use(bodyParser.json()); // Middleware para interpretar JSON no corpo das requisições

/**
 * Rotas para criar e salvar dados nas tabelas
 

// Rota para criar um novo usuário
app.post("/usuario", async (req, res) => {
  try {
    const usuario = await Usuario.create(req.body); // Cria o usuário com base nos dados enviados
    res.json({ message: "Usuário criado com sucesso!", usuario });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para criar uma nova empresa
app.post("/empresa", async (req, res) => {
  try {
    const empresa = await Empresa.create(req.body); // Cria a empresa com base nos dados enviados
    res.json({ message: "Empresa criada com sucesso!", empresa });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para criar um novo profissional e serviço
app.post("/profissional-servico", async (req, res) => {
  try {
    const profissionalServico = await ProfissionalServico.create(req.body); // Cria o registro com base nos dados enviados
    res.json({
      message: "Profissional e serviço criados com sucesso!",
      profissionalServico,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rota para criar um novo agendamento
app.post("/agendamento", async (req, res) => {
  try {
    const agendamento = await Agendamento.create(req.body); // Cria o agendamento com base nos dados enviados
    res.json({ message: "Agendamento criado com sucesso!", agendamento });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Sincronização com o banco de dados e inicialização do servidor
 
app.listen(3000, async () => {
  try {
    await sequelize.sync({ force: true }); // Sincroniza as tabelas com o banco (force: true para recriar as tabelas)
    console.log(
      "Banco de dados sincronizado e servidor rodando na porta 3000!"
    );
  } catch (error) {
    console.error("Erro ao sincronizar o banco de dados:", error);
  }
}); 
*/

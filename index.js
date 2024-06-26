const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const { Pool } = require("pg");

const url_bancoDeDados = 'postgresql://neondb_owner:bMi6tQ9UkqvC@ep-black-sunset-a5k73eqv.us-east-2.aws.neon.tech/neondb?sslmode=require'

const conexao = new Pool({
  connectionString: url_bancoDeDados,
  ssl: {
    rejectUnauthorized: true
  }
})

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

//Página de login
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

//Verificando se o usuário é válido
  try {
    const result = await conexao.query('SELECT * FROM adm WHERE numero_registro = $1 AND senha = $2', [username, password]);
    
    if (result.rows.length > 0) {
      res.redirect('/home');
    } else {
      res.redirect('/login?message=Usuário ou senha incorretos!');
    }
  }catch(e){
    console.log(e)
  }
});

//Página home - listagem dos produtos
app.get('/home', async (req, res) => {
  try {
    const result = await conexao.query(`
      SELECT 
        produtos.id AS id,
        produtos.nome AS nome,
        produtos.descricao AS descricao,
        produtos.quantidade AS quantidade,
        produtos.preco_unitario AS preco_unitario,
        categorias.id AS categoria_id,
        categorias.nome AS categoria,
        fornecedores.id AS fornecedor_id,
        fornecedores.nome AS fornecedor,
        produtos.status AS status
      FROM 
        produtos
      INNER JOIN categorias ON produtos.categoria_id = categorias.id
      INNER JOIN fornecedores ON produtos.fornecedor_id = fornecedores.id
    `);

    const itens = result.rows;
    const categoriasResult = await conexao.query('SELECT id, nome FROM categorias ORDER BY nome');
    const fornecedoresResult = await conexao.query('SELECT id, nome FROM fornecedores ORDER BY nome');

    const categorias = categoriasResult.rows;
    const fornecedores = fornecedoresResult.rows;

    res.render('home', { itens, categorias, fornecedores });
  }catch(e){
    console.log(e)
  }
});

//Pesquisar item
app.get('/pesquisa', async (req, res) => {
  try {
    const palavraPesquisada = req.query.query;

    const query = `
      SELECT 
        produtos.id AS id,
        produtos.nome AS nome,
        produtos.descricao AS descricao,
        produtos.quantidade AS quantidade,
        produtos.preco_unitario AS preco_unitario,
        categorias.id AS categoria_id,
        categorias.nome AS categoria,
        fornecedores.id AS fornecedor_id,
        fornecedores.nome AS fornecedor,
        produtos.status AS status
      FROM 
        produtos
      INNER JOIN categorias ON produtos.categoria_id = categorias.id
      INNER JOIN fornecedores ON produtos.fornecedor_id = fornecedores.id
      WHERE 
        LOWER(produtos.nome) LIKE LOWER($1) OR
        LOWER(produtos.descricao) LIKE LOWER($1)
    `;

    const result = await conexao.query(query, [`%${palavraPesquisada}%`]);

    const itens = result.rows;
    const categoriasResult = await conexao.query('SELECT id, nome FROM categorias ORDER BY nome');
    const fornecedoresResult = await conexao.query('SELECT id, nome FROM fornecedores ORDER BY nome');

    const categorias = categoriasResult.rows;
    const fornecedores = fornecedoresResult.rows;

    res.render('pesquisa', { itens, categorias, fornecedores });
  }catch(e){
    console.log(e)
  }
});

//Adicionar item
app.post('/add', async (req, res) => {
  const { nome, descricao, quantidade, preco_unitario, categoria_id, fornecedor_id, status } = req.body;
  try {
    await conexao.query('INSERT INTO produtos (nome, descricao, quantidade, preco_unitario, categoria_id, fornecedor_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
      [nome, descricao, quantidade, preco_unitario, categoria_id, fornecedor_id, status]);
    res.redirect('/home');
  }catch(e){
    console.log(e)
  }
});

//Adicionar fornecedor
app.post('/addf', async (req, res) => {
  const { nome, contato, endereco } = req.body;
  try {
    await conexao.query('INSERT INTO fornecedores (nome, contato, endereco) VALUES ($1, $2, $3)', [nome, contato, endereco]);
    res.redirect('/home');
  }catch(e){
    console.log(e)
  }
});

//Mostrar registros - COMPRA E VENDA
app.get('/registros', async (req, res) => {
  try {
    const result = await conexao.query(`
            SELECT acoes_estoque.id, produtos.nome AS produto, acoes_estoque.acao, acoes_estoque.quantidade, acoes_estoque.data, acoes_estoque.descricao
            FROM acoes_estoque
            JOIN produtos ON acoes_estoque.produto_id = produtos.id
        `);

    res.render('registros', { registros: result.rows });
  }catch(e){
    console.log(e)
  }
});

//Editar item
app.post('/edit/:id', async (req, res) => {
  const id = req.params.id;
  const { nome, descricao, quantidade, preco_unitario, categoria_id, fornecedor_id, status } = req.body;
  try {
    await conexao.query('UPDATE produtos SET nome = $1, descricao = $2, quantidade = $3, preco_unitario = $4, categoria_id = $5, fornecedor_id = $6, status = $7 WHERE id = $8', 
      [nome, descricao, quantidade, preco_unitario, categoria_id, fornecedor_id, status, id]);
    res.redirect('/home');
  }catch(e){
    console.log(e)
  }
});

//Excluir item
app.post('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await conexao.query('DELETE FROM produtos WHERE id = $1', [id]);
    res.redirect('/home');
  }catch(e){
    console.log(e)
  }
});

//Rodando o servidor
app.listen(3000, function(){
  console.log('O Servidor está online na porta 3000');
});
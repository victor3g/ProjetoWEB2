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

//Rodando o servidor
app.listen(3000, function(){
  console.log('O Servidor está online na porta 3000');
});
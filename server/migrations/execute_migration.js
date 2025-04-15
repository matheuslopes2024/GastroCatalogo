import { Pool, neonConfig } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

// Configurar o WebSocket para o Neon Serverless
neonConfig.webSocketConstructor = ws;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script simples para executar a migração diretamente
async function executeMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('Erro: DATABASE_URL não está definida');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('Executando migração para adicionar colunas de estoque...');
    
    // Ler e executar o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'add_stock_columns.sql');
    const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
    
    await pool.query(sqlQuery);
    
    console.log('Migração executada com sucesso!');
  } catch (error) {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

executeMigration();
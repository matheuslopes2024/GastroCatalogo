import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração da conexão com o banco de dados
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL deve ser definida');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Função para executar todas as migrações
async function runMigrations() {
  try {
    console.log('Iniciando processo de migração do banco de dados...');
    
    // Criar tabela de registro de migrações se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Obter migrações já executadas
    const { rows: executedMigrations } = await pool.query('SELECT name FROM migrations');
    const executedMigrationNames = executedMigrations.map(m => m.name);
    
    // Ler arquivos SQL no diretório de migrações
    const migrationsDir = path.join(__dirname);
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Ordenar para executar na ordem correta
    
    console.log(`Encontradas ${migrationFiles.length} migrações para processar`);
    
    // Executar cada migração pendente
    for (const file of migrationFiles) {
      if (executedMigrationNames.includes(file)) {
        console.log(`Migração ${file} já foi executada. Pulando...`);
        continue;
      }
      
      const migrationSql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`Executando migração: ${file}...`);
      
      // Executar em uma transação
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Executar o SQL da migração
        await client.query(migrationSql);
        
        // Registrar a migração como executada
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        
        await client.query('COMMIT');
        console.log(`Migração ${file} executada com sucesso!`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Erro ao executar migração ${file}:`, err);
        throw err;
      } finally {
        client.release();
      }
    }
    
    console.log('Processo de migração concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o processo de migração:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar as migrações
runMigrations();
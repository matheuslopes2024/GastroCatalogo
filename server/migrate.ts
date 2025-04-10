import { pool, db } from './db';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';

// Esta função cria as tabelas necessárias para o chat e FAQ
async function runMigration() {
  try {
    console.log('Iniciando migração das tabelas...');

    // Verificando se a tabela chatConversations já existe
    const chatConversationsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_conversations'
      ) as exists;
    `);
    
    console.log('Verificação da tabela chat_conversations:', chatConversationsExists);
    
    if (!chatConversationsExists[0]?.exists) {
      console.log('Criando tabela chat_conversations...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_conversations (
          id SERIAL PRIMARY KEY,
          participant_ids JSONB NOT NULL,
          last_message_id INTEGER,
          last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
          subject TEXT,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    }

    // Verificando se a tabela chatMessages já existe
    const chatMessagesExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages'
      ) as exists;
    `);
    
    console.log('Verificação da tabela chat_messages:', chatMessagesExists);
    
    if (!chatMessagesExists[0]?.exists) {
      console.log('Criando tabela chat_messages...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          conversation_id INTEGER REFERENCES chat_conversations(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT FALSE,
          attachment_url TEXT,
          attachment_type TEXT,
          attachment_data TEXT,
          attachment_size INTEGER,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    }

    // Verificando se a tabela faqCategories já existe
    const faqCategoriesExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'faq_categories'
      ) as exists;
    `);
    
    console.log('Verificação da tabela faq_categories:', faqCategoriesExists);
    
    if (!faqCategoriesExists[0]?.exists) {
      console.log('Criando tabela faq_categories...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS faq_categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL,
          description TEXT,
          icon TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    }

    // Verificando se a tabela faqItems já existe
    const faqItemsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'faq_items'
      ) as exists;
    `);
    
    console.log('Verificação da tabela faq_items:', faqItemsExists);
    
    if (!faqItemsExists[0]?.exists) {
      console.log('Criando tabela faq_items...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS faq_items (
          id SERIAL PRIMARY KEY,
          category_id INTEGER NOT NULL REFERENCES faq_categories(id) ON DELETE CASCADE,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          active BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
    }

    console.log('Migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
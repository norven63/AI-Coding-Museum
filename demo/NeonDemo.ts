// Neon示例
import { neon } from '@neondatabase/serverless';

// 连接字符串
const sql = neon('postgresql://neondb_owner:npg_B7OVDSq9GwQl@ep-curly-breeze-a8n5vism-pooler.eastus2.azure.neon.tech/neondb?sslmode=require');

// 查询示例
async function main() {
  // 1. 创建表
  await sql`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`;
  console.log('✅ 表创建成功');

  // 2. 插入数据
  await sql`INSERT INTO users (name, email) VALUES ('张三', 'zhangsan@example.com')`;
  console.log('✅ 数据插入成功');

  // 3. 查询数据
  const users = await sql`SELECT * FROM users`;
  console.log('✅ 查询结果:', users);
  // 4. 带参数的查询（自动防 SQL 注入）
  const name = '张三';
  const result = await sql`SELECT * FROM users WHERE name = ${name}`;
  console.log('✅ 条件查询:', result);
}

main().catch(console.error);

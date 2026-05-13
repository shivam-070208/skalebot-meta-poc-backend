import { Pool } from "pg"
const DATABASE_URL = process.env.DATABASE_URL
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

const query = async (text: string, params?: any[]) => {
  return pool.query(text, params)
}

export { query, pool }
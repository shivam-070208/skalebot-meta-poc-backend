import "dotenv/config"
import { query } from "@/config/db"
import fs from "fs"
import path from "path"

async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE,
      run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `)
}

async function getExecutedMigrations() {
  const res = await query(`SELECT name FROM migrations`)
  return res.rows.map((row: any) => row.name)
}

function listPrismaStyleMigrations(migrationsPath: string): string[] {
  if (!fs.existsSync(migrationsPath)) {
    return []
  }
  return fs
    .readdirSync(migrationsPath, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) =>
      fs.existsSync(path.join(migrationsPath, name, "migration.sql")),
    )
    .sort()
}

async function runMigrations() {
  const migrationsPath = path.join(process.cwd(), "src/db/migrations")

  const migrationNames = listPrismaStyleMigrations(migrationsPath)

  const executed = await getExecutedMigrations()

  for (const name of migrationNames) {
    if (executed.includes(name)) {
      console.log(`Skipping: ${name}`)
      continue
    }

    const filePath = path.join(migrationsPath, name, "migration.sql")
    const sql = fs.readFileSync(filePath, "utf-8")

    console.log(`Running: ${name}`)

    try {
      await query("BEGIN")
      await query(sql)
      await query(`INSERT INTO migrations (name) VALUES ($1)`, [name])
      await query("COMMIT")

      console.log(`Done: ${name}`)
    } catch (err) {
      await query("ROLLBACK")
      console.error(`Failed: ${name}`, err)
      process.exit(1)
    }
  }

  console.log("All migrations completed ✅")
  process.exit(0)
}

async function main() {
  await ensureMigrationsTable()
  await runMigrations()
}

main()
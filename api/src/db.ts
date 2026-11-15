import "dotenv/config";
import mysql, { type PoolConnection, type RowDataPacket, type ResultSetHeader } from "mysql2/promise";

export const DATABASE_URL = process.env.DATABASE_URL ?? "mysql://root:@127.0.0.1:3306/iscomfest";

export const pool = mysql.createPool({
  uri: DATABASE_URL,
  connectionLimit: 10,
  decimalNumbers: true, // DECIMAL -> number, bukan string
  dateStrings: true, // DATE/DATETIME -> "YYYY-MM-DD", tanpa geser zona waktu
  timezone: "+07:00",
});

type Db = typeof pool | PoolConnection;

/** SELECT -> array baris bertipe T. */
export async function rows<T>(sql: string, params: unknown[] = [], db: Db = pool): Promise<T[]> {
  const [r] = await db.query<RowDataPacket[]>(sql, params);
  return r as T[];
}

/** INSERT/UPDATE/DELETE -> insertId & affectedRows. */
export async function exec(sql: string, params: unknown[] = [], db: Db = pool): Promise<ResultSetHeader> {
  const [r] = await db.query<ResultSetHeader>(sql, params);
  return r;
}

/** Jalankan fn di dalam transaksi. */
export async function tx<T>(fn: (c: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(conn);
    await conn.commit();
    return out;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

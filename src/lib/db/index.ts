import pool from './pool';

export async function query(text: string, params?: any[]) {
  const res = await pool.query(text, params);
  return res;
}

export async function getClient() {
  return pool.connect();
}

export * from './repositories';
export { default as pool } from './pool';

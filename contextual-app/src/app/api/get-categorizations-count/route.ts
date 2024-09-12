import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT COUNT(*) FROM categorized_texts');
      const count = parseInt(result.rows[0].count, 10);
      return NextResponse.json(count);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching categorization count:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
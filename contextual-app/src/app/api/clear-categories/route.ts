import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

export async function DELETE() {
  try {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM categorized_texts;'); // Clear the categorized_texts table
      return NextResponse.json({ message: 'All categories deleted successfully.' });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error clearing categories:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://njuskalo:njuskalo_pass@localhost:5432/njuskalo_db',
});

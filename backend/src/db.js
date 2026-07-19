import pg from "pg";
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://ivsadmin:dbpassword123@db:5432/ivsplatform",
});
export default pool;

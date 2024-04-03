import { configDotenv } from "dotenv";
import { Pool } from "pg";

configDotenv();

const pool = new Pool({
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
})
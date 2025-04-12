import { defineConfig } from "drizzle-kit";
import "dotenv/config";

export default defineConfig({
  schema: "./shared/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: "localhost",
    port: 5432,
    user: "apoorvagaddam",
    password: "mypassword", // Your dummy password
    database: "moviedb",
    ssl: false,  // ✅ Disable SSL for local
  },
});

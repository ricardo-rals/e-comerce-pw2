import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    async adapter() {
      const client = createClient({
        url: process.env.DATABASE_URL ?? "file:./dev.db",
      });
      return new PrismaLibSQL(client);
    },
  },
});

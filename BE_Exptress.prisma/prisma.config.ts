import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // globalThis를 사용하면 @types/node 없이도 process에 접근할 수 있습니다.
    url: (globalThis as any).process.env.DATABASE_URL, 
  },
});
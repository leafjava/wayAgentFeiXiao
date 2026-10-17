import { seedAll } from "../src/modules/seed/seed.data";
import { prisma } from "../src/lib/prisma";

seedAll().then(result => console.log("Seed:", result)).catch(error => {
  console.error(error.message);process.exitCode = 1;
}).finally(() => prisma.$disconnect());

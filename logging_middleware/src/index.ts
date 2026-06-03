import { Log } from "./logger";

async function main() {
  const result = await Log(
    "backend",
    "info",
    "service",
    "Logging middleware started"
  );

  console.log(result);
}

main();
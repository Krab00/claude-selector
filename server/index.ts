import { Server } from "./server";

const server = new Server();
server.start();

console.log(`claude-selector server running on http://localhost:${server.getPort()}`);

const shutdown = () => {
  console.log("\nShutting down...");
  server.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

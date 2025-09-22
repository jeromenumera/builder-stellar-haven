import serverless from "serverless-http";
import { createServer } from "../../server";

// Create the express app from our server factory
const app = createServer();

// Export the serverless handler with binary support for images
export const handler = serverless(app, {
  binary: [
    'image/*',
    'application/octet-stream'
  ],
});

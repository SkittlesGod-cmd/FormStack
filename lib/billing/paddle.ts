import { Paddle, Environment } from "@paddle/paddle-node-sdk";

let _paddle: Paddle | null = null;

export function getPaddleClient(): Paddle {
  if (!_paddle) {
    const key = process.env.PADDLE_API_KEY;
    if (!key) throw new Error("PADDLE_API_KEY is not configured.");
    _paddle = new Paddle(key, {
      environment: process.env.PADDLE_ENVIRONMENT === "production"
        ? Environment.production
        : Environment.sandbox,
    });
  }
  return _paddle;
}

export const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET ?? "";

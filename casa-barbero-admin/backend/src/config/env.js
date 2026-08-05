import "dotenv/config";

export const env = {
  port: Number(process.env.PORT || 4174),
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
  keepaliveSecret: process.env.KEEPALIVE_SECRET,
  keepaliveSecretClaude: process.env.KEEPALIVE_SECRET_CLAUDE
};

import 'dotenv/config';
import { registerAs } from '@nestjs/config';
const frontend = {
  host: process.env.FRONTEND_URL as string,
};
const google = {
  clientId: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  callbackUrl: process.env.GOOGLE_CALLBACK_URL as string,
};
const config = { frontend, google };

export const envs = config;

export default registerAs('envs', () => envs);

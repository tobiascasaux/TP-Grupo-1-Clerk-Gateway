import 'dotenv/config';

export const config = {
  port: process.env.PORT || 3000,
  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  internalKey: process.env.INTERNAL_KEY,
  mongoUri: process.env.MONGO_URI,
  services: {
    ms1: process.env.MS1_URL,
    ms2: process.env.MS2_URL,
    ms3: process.env.MS3_URL,
  },
  defaultTimeoutMs: Number(process.env.DEFAULT_SERVICE_TIMEOUT_MS) || 10000,
};

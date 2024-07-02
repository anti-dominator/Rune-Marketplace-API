import dotenv from "dotenv";
dotenv.config();

try {
  dotenv.config();
} catch (error) {
  console.error("Error loading environment variables:", error);
  process.exit(1);
}

export const MONGO_URL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`;
export const PORT = process.env.PORT || 9000;

export const TESTNET = "testnet";
export const MAINNET = "mainnet";
export const networkType = process.env.NETWORKTYPE ?? "";

export const ACTIVE = "Active";
export const PENDING = "Pending";
export const SOLD = "Sold";

export const FASTESTFEE = "fastestFee";
export const HALFHOURFEE = "halfHourFee";
export const HOURFEE = "hourFee";
export const MINIMUMFEE = "minimumFee";

export const SEND_UTXO_FEE_LIMIT = 10000;
export const PRIVATE_KEY: string = process.env.PRIVATE_KEY as string;

import axios from "axios";
import dotenv from "dotenv";
import { setUtxoFlag, waitUtxoFlag } from "./mutex";
import { TESTNET } from "../config/config";

// Configuration from .env file
dotenv.config();

// Getting GetBlock API from .env file
const getBlockAPI: string = process.env.GET_BLOCK_API ?? "";

// Get JoinedPsbt from two psbts using go.getblock.io
export const getJoinedPsbt = async (
  psbtArray: Array<string>,
  networkType: string
): Promise<any> => {
  try {
    // Wait for getblock api rate protection
    await waitUtxoFlag();
    await setUtxoFlag(1);

    // Request URL
    const url = `https://go.getblock.io/${
      networkType == TESTNET
        ? process.env.GET_BLOCK_API_TESTNET
        : process.env.GET_BLOCK_API_MAINNET
    }/`;

    // Request data
    const data = {
      jsonrpc: "2.0",
      method: "joinpsbts",
      params: [[...psbtArray]],
      id: "getblock.io",
    };

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    let res = await axios.post(url, data, config);

    // Releast lock for getblock api rate limit
    await setUtxoFlag(0);

    return res.data.result;
  } catch (err: any) {
    await setUtxoFlag(0);

    console.log("JoinPsbt Request Error");
  }
};

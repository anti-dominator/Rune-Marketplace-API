import { networkType } from "../../config/config";
import ecc from "@bitcoinerlab/secp256k1";
import { initEccLib } from "bitcoinjs-lib";
import { WIFWallet } from "./WIFWallet";
import { PRIVATE_KEY } from "../../config/config";

initEccLib(ecc as any);

let wallet: any;

wallet = new WIFWallet({
  networkType: networkType,
  privateKey: PRIVATE_KEY,
});
export default wallet;

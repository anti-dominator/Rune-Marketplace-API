import { Psbt, initEccLib } from "bitcoinjs-lib";

import { networkType, SEND_UTXO_FEE_LIMIT } from "../../config/config";
import wallet from "../wallet/initializeWallet";
import ecc from "@bitcoinerlab/secp256k1";
import { getSendBTCUTXOArray } from "../utxo/utxo.management";
import {
  OrdinalsUtxoSendPsbt,
  RedeemOrdinalsUtxoSendPsbt,
} from "./utxo.ordinalsSendPsbt";
import { getBtcUtxoInfo } from "../../utils/unisat.api";

initEccLib(ecc as any);

// Create Buyer Offer Psbt
export const createOfferPsbt = async (createOfferData: any): Promise<any> => {
  // Fetch buyer's payment wallet utxo array
  let utxos = await getBtcUtxoInfo(
    createOfferData.buyerPaymentAddress,
    networkType
  );

  // Select utxos which is containing on buyer offer psbt input
  let selectedUtxos = [];

  // Initialize Fee for dummy psbt
  let redeemFee = SEND_UTXO_FEE_LIMIT;

  // Extract the exact fee and selected utxos
  for (let i = 0; i < 3; i++) {
    // Select utxos which is containing on buyer offer psbt input
    let response = getSendBTCUTXOArray(
      utxos,
      createOfferData.price + createOfferData.serviceFee + redeemFee
    );
    if (!response.isSuccess) {
      return { isSuccess: false, data: "Not enough balance in your wallet." };
    }
    selectedUtxos = response.data;

    // Create dummy psbt for extracting exact fee
    let redeemPsbt: Psbt = await RedeemOrdinalsUtxoSendPsbt(
      selectedUtxos,
      networkType,
      createOfferData,
      redeemFee
    );
    redeemPsbt = wallet.signPsbt(redeemPsbt, wallet.ecPair);

    // Calculate exact fee based on dummy transaction
    redeemFee =
      redeemPsbt.extractTransaction(true).virtualSize() *
      createOfferData.feeRate;
  }

  // Select final selected utxos for real transaction
  let response = getSendBTCUTXOArray(
    utxos,
    createOfferData.price + createOfferData.serviceFee + redeemFee
  );
  if (!response.isSuccess) {
    return { isSuccess: false, data: "Not enough balance in your wallet." };
  }
  selectedUtxos = response.data;

  // Create real psbt for buyer
  let psbt = await OrdinalsUtxoSendPsbt(
    selectedUtxos,
    networkType,
    createOfferData,
    redeemFee
  );

  // Create signInputArray
  let signInputArray = [];
  for (let i = 0; i < psbt.inputCount; i++) {
    signInputArray.push(i);
  }

  return { isSuccess: true, data: psbt.toHex(), inputs: signInputArray };
};

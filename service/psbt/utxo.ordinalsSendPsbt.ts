import * as Bitcoin from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";
import { TESTNET } from "../../config/config";
import { getInscriptionInfo } from "../../utils/unisat.api";
import wallet from "../wallet/initializeWallet";
import { IUtxo } from "../../utils/types";
Bitcoin.initEccLib(ecc);

// Create dummy psbt for buyer offer
export const RedeemOrdinalsUtxoSendPsbt = async (
  selectedUtxos: Array<IUtxo>,
  networkType: string,
  createOfferData: any,
  redeemFee: number
): Promise<Bitcoin.Psbt> => {
  // Create psbt instance
  const psbt = new Bitcoin.Psbt({
    network:
      networkType == TESTNET
        ? Bitcoin.networks.testnet
        : Bitcoin.networks.bitcoin,
  });

  // Sum of input BTC utxo array
  let inputUtxoSumValue: number = selectedUtxos.reduce(
    (accumulator: number, currentValue: IUtxo) =>
      accumulator + currentValue.value,
    0
  );

  // Get ordinals UTXO infomation
  let inscriptionUTXO: IUtxo = await getInscriptionInfo(
    createOfferData.ordinalId,
    networkType
  );

  // Input ordinal UTXO in psbt
  psbt.addInput({
    hash: inscriptionUTXO.txid,
    index: inscriptionUTXO.vout,
    witnessUtxo: {
      value: inscriptionUTXO.value,
      script: wallet.output,
    },
    tapInternalKey: Buffer.from(wallet.publicKey, "hex").subarray(1, 33),
  });

  // Input all buyer BTC UTXOs for ordinal price
  selectedUtxos.forEach((utxo) => {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.value,
        script: wallet.output,
      },
      tapInternalKey: Buffer.from(wallet.publicKey, "hex").subarray(1, 33),
    });
  });

  // Inscription psbt outpout
  psbt.addOutput({
    address: wallet.address,
    value: inscriptionUTXO.value,
  });

  // Money for seller
  psbt.addOutput({
    address: wallet.address,
    value: createOfferData.price,
  });

  // Service Fee UTXO
  psbt.addOutput({
    address: wallet.address,
    value: createOfferData.serviceFee,
  });

  // Change UTXO
  psbt.addOutput({
    address: wallet.address,
    value:
      inputUtxoSumValue -
      redeemFee -
      createOfferData.serviceFee -
      createOfferData.price,
  });

  return psbt;
};

// Create real psbt for buyer offer
export const OrdinalsUtxoSendPsbt = async (
  selectedUtxos: Array<IUtxo>,
  networkType: string,
  createOfferData: any,
  redeemFee: number
): Promise<Bitcoin.Psbt> => {
  // Create new psbt instance
  const psbt = new Bitcoin.Psbt({
    network:
      networkType == TESTNET
        ? Bitcoin.networks.testnet
        : Bitcoin.networks.bitcoin,
  });

  // Initialize network instance
  const network: Bitcoin.Network =
    networkType == TESTNET
      ? Bitcoin.networks.testnet
      : Bitcoin.networks.bitcoin;

  // Sum btc utxo array amount
  let inputUtxoSumValue: number = selectedUtxos.reduce(
    (accumulator: number, currentValue: IUtxo) =>
      accumulator + currentValue.value,
    0
  );

  // get Inscription utxo info
  let inscriptionUTXO = await getInscriptionInfo(
    createOfferData.ordinalId,
    networkType
  );

  // Input buyer btc utxo array on psbt
  selectedUtxos.forEach((utxo) => {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        value: utxo.value,
        script: Bitcoin.address.toOutputScript(
          createOfferData.buyerPaymentAddress as string,
          network
        ),
      },
      tapInternalKey: Buffer.from(
        createOfferData.buyerPaymentPublicKey,
        "hex"
      ).subarray(1, 33),
    });
  });

  // Inscription utxo of psbt
  psbt.addOutput({
    address: createOfferData.buyerPaymentAddress,
    value: inscriptionUTXO.value,
  });

  // Service fee utxo for platform
  psbt.addOutput({
    address: wallet.address,
    value: createOfferData.serviceFee,
  });

  // Change btc utxo for buyer
  psbt.addOutput({
    address: createOfferData.buyerPaymentAddress,
    value:
      inputUtxoSumValue -
      redeemFee -
      createOfferData.price -
      createOfferData.serviceFee,
  });

  return psbt;
};

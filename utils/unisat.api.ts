import axios from "axios";
import { TESTNET } from "../config/config";
import dotenv from "dotenv";
import { setApiIterator, setUtxoFlag, waitUtxoFlag } from "./mutex";
import app from "..";
import { IInscriptionUtxo, IUtxo } from "./types";

// Configuration from .env file
dotenv.config();

// Getting Unisat API array from .env file
const apiArray = JSON.parse(process.env.OPENAPI_UNISAT_TOKEN ?? "");

// Get Inscription UTXO Info from inscriptioinId using Unisat api
export const getInscriptionInfo = async (
  inscriptionid: string,
  networkType: string
): Promise<any> => {
  try {
    await waitUtxoFlag();
    await setUtxoFlag(1);

    if (app.locals.iterator >= apiArray.length) {
      await setApiIterator(0);
    }

    const url = `https://open-api${
      networkType == TESTNET ? "-testnet" : ""
    }.unisat.io/v1/indexer/inscription/info/${inscriptionid}`;

    const config = {
      headers: {
        Authorization: `Bearer ${apiArray[app.locals.iterator] as string}`,
      },
    };
    let res = await axios.get(url, config);

    let iterator = app.locals.iterator + 1;
    await setApiIterator(iterator);

    await setUtxoFlag(0);
    const inscriptionInfo = res.data;
    const info: IInscriptionUtxo = {
      txid: inscriptionInfo.data.utxo.txid,
      vout: inscriptionInfo.data.utxo.vout,
      value: inscriptionInfo.data.utxo.satoshi,
      address: inscriptionInfo.data.address,
    };

    return info;
  } catch (err: any) {
    await setUtxoFlag(0);

    console.log("Get Inscription Utxo Error");
  }
};

// Get BTC UTXO Info from inscriptioinId using Unisat api
export const getBtcUtxoInfo = async (address: string, networkType: string) => {
  await waitUtxoFlag();
  await setUtxoFlag(1);

  if (app.locals.iterator >= apiArray.length) {
    await setApiIterator(0);
  }

  const url = `https://open-api${
    networkType == TESTNET ? "-testnet" : ""
  }.unisat.io/v1/indexer/address/${address}/utxo-data`;

  const config = {
    headers: {
      Authorization: `Bearer ${apiArray[app.locals.iterator] as string}`,
    },
  };

  let iterator = app.locals.iterator + 1;
  await setApiIterator(iterator);

  let cursor = 0;
  const size = 5000;
  let utxos: any = [];

  while (1) {
    const res = await axios.get(url, { ...config, params: { cursor, size } });
    if (res.data.code === -1) throw "Invalid Address";
    let fetchUtxos = res.data.data.utxo.reverse();
    utxos.push(
      ...(fetchUtxos as any[]).map((utxo) => {
        return {
          txid: utxo.txid,
          value: utxo.satoshi,
          vout: utxo.vout,
        };
      })
    );
    cursor += fetchUtxos.length;

    if (cursor >= res.data.data.total - res.data.data.totalRunes) break;
  }

  await setUtxoFlag(0);
  return utxos;
};

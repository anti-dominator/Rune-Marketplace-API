import * as bitcoin from "bitcoinjs-lib";
import { initEccLib, networks } from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";
import ECPairFactory, { type ECPairInterface } from "ecpair";
import { TESTNET } from "../../config/config";

interface IWIFWallet {
  networkType: string;
  privateKey: string;
}

initEccLib(ecc);

const ECPair = ECPairFactory(ecc);

export class WIFWallet {
  private network: bitcoin.networks.Network;
  public ecPair: ECPairInterface;
  public address: string;
  public output: Buffer;
  public publicKey: string;
  public seckey?: any;
  public secret: any;
  public pubkey: any;

  constructor(walletParam: IWIFWallet) {
    if (walletParam.networkType == TESTNET) {
      this.network = networks.testnet;
    } else {
      this.network = networks.bitcoin;
    }

    this.ecPair = ECPair.fromWIF(walletParam.privateKey, this.network);

    this.secret = this.ecPair.privateKey?.toString("hex");
    // Extract the private key in hexadecimal format
    this.secret = this.ecPair.toWIF();

    // Extract the public key in hexadecimal format
    this.pubkey = this.ecPair.publicKey.toString("hex");

    const { address, output } = bitcoin.payments.p2tr({
      internalPubkey: this.ecPair.publicKey.subarray(1, 33),
      network: this.network,
    });
    this.address = address as string;
    this.output = output as Buffer;
    this.publicKey = this.ecPair.publicKey.toString("hex");
  }

  signPsbt(psbt: bitcoin.Psbt, ecPair: ECPairInterface): bitcoin.Psbt {
    const tweakedChildNode = ecPair.tweak(
      bitcoin.crypto.taggedHash("TapTweak", ecPair.publicKey.subarray(1, 33))
    );

    for (let i = 0; i < psbt.inputCount; i++) {
      psbt.signInput(i, tweakedChildNode);
      psbt.validateSignaturesOfInput(i, () => true);
      psbt.finalizeInput(i);
    }
    return psbt;
  }
}

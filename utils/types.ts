export interface IOrderData {
  ordinalId: string;
  price: number;
  sellerPaymentAddress: string;
  sellerOrdinalPublicKey: string;
  status: "Active" | "Pending" | "Sold";
  ordinalUtxoTxId: string;
  ordinalUtxoVout: string;
  serviceFee: number;
  signedListingPSBT: string;
}

export interface IUtxo {
  txid: string;
  vout: number;
  value: number;
}

export interface IInscriptionUtxo {
  txid: string;
  vout: number;
  value: number;
  address: string;
}

import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  ordinalId: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  sellerPaymentAddress: { type: String, required: true },
  sellerOrdinalPublicKey: { type: String, required: true },
  status: { type: String, required: true },
  ordinalUtxoTxId: { type: String, required: true },
  ordinalUtxoVout: { type: Number, requred: true },
  serviceFee: { type: Number },
  signedListingPSBT: { type: String, required: true },
});

const OrderModel = mongoose.model("order", OrderSchema);

export default OrderModel;

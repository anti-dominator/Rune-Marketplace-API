import { Request, Response, Router } from "express";
import { check, validationResult } from "express-validator";
import Order from "../../model/OrderModel";
import * as Bitcoin from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";
import { HALFHOURFEE, ACTIVE } from "../../config/config";
import { createOfferPsbt } from "../../service/psbt/createOfferPsbt";

Bitcoin.initEccLib(ecc);

//create a new instance of the express router
const CreateOfferRouter = Router();

// @route    POST api/create-offer
// @desc     Create Psbt for buying ordinal
// @access   Private

CreateOfferRouter.post(
  "/create-offer",
  check("ordinalId", "OrdinalId is required").notEmpty(),
  check("buyerPaymentAddress", "BuyerPaymentAddress is required").notEmpty(),
  check("buyerOrdinalAddress", "BuyerOrdinalAddress is required").notEmpty(),
  check(
    "buyerPaymentPublicKey",
    "BuyerPaymentPublicKey is required"
  ).notEmpty(),
  check("feeRate", "FeeRate is required.").notEmpty(),

  async (req: Request, res: Response) => {
    try {
      // Validate Form Inputs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(500).json({ error: errors.array() });
      }
      // Getting parameter from request
      let {
        ordinalId,
        buyerPaymentAddress,
        buyerOrdinalAddress,
        buyerPaymentPublicKey,
        feeRate,
      } = req.body;

      // Change FeeRate to number
      feeRate = +feeRate;

      // Check if this ordinalId exists on database.
      const ordinalData = await Order.findOne({ ordinalId: ordinalId });
      if (!ordinalData) {
        return res.status(500).json({ error: "This Ordinal is not exist." });
      }
      if (ordinalData.status != ACTIVE) {
        return res
          .status(500)
          .json({ error: "This ordinal is already sold or pending status." });
      }

      // Integrate all necessary data
      const createOfferData = {
        ...ordinalData.toJSON(),
        buyerPaymentAddress,
        buyerOrdinalAddress,
        buyerPaymentPublicKey,
        feeRate,
      };

      // Create Psbt for create buyer offer
      const response = await createOfferPsbt(createOfferData);

      // Send Psbt to frontend
      if (response.isSuccess) {
        return res
          .status(200)
          .json({ psbt: response.data, inputs: response.inputs });
      } else {
        return res.status(500).json({ error: response.data });
      }
    } catch (error: any) {
      console.log(error.message);
      return res.status(500).send({ error });
    }
  }
);

export default CreateOfferRouter;

import { Request, Response, Router } from "express";
import { check, validationResult } from "express-validator";
import Order from "../../model/OrderModel";
import * as Bitcoin from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";

Bitcoin.initEccLib(ecc);

//create a new instance of the express router
const DeleteListingRouter = Router();

// @route    POST api/delist
// @desc     Delete order
// @access   Private

DeleteListingRouter.post(
  "/delist",
  check("sellerOrdinalId", "SellerOrdinals is required").notEmpty(),
  check("sellerPaymentAddress", "SellerPaymentAddresss is required").notEmpty(),
  check(
    "sellerOrdinalPublicKey",
    "SellerOrdinalPublicKey is required"
  ).notEmpty(),

  async (req: Request, res: Response) => {
    try {
      // Validate Form Inputs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(500).json({ error: errors.array() });
      }
      // Getting parameter from request
      const { sellerOrdinalId, sellerPaymentAddress, sellerOrdinalPublicKey } =
        req.body;

      // Check if this ordinalId exists on database.
      const ordinalData = await Order.findOne({ ordinalId: sellerOrdinalId });
      if (!ordinalData) {
        return res.status(500).json({ error: "This Ordinal is not exist." });
      }

      // Check if the request data is valid in publickey and paymentaddress
      if (
        sellerOrdinalPublicKey === ordinalData.sellerOrdinalPublicKey &&
        sellerPaymentAddress === ordinalData.sellerPaymentAddress
      ) {
        const deletedItem = await Order.deleteOne({
          ordinalId: sellerOrdinalId,
        });

        return res.status(200).send({ data: deletedItem });
      } else {
        return res.status(500).send({ error: "OrdinalData is not valid." });
      }
    } catch (error: any) {
      console.log(error.message);
      return res.status(500).send({ error });
    }
  }
);

export default DeleteListingRouter;

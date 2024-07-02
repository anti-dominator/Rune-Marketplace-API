import { Request, Response, Router } from "express";
import { check, validationResult } from "express-validator";
import Order from "../../model/OrderModel";
import * as Bitcoin from "bitcoinjs-lib";
import ecc from "@bitcoinerlab/secp256k1";
import { ACTIVE, MAINNET, TESTNET, networkType } from "../../config/config";
import { getJoinedPsbt } from "../../utils/getBlock.api";

Bitcoin.initEccLib(ecc);

//create a new instance of the express router
const SubmitOfferRouter = Router();

// @route    POST api/submit-offer
// @desc     Execute pbst for buying ordinal
// @access   Private

SubmitOfferRouter.post(
  "/submit-offer",
  check("ordinalId", "OrdinalId is required").notEmpty(),
  check("signedBuyerPSBT", "SignedBuyerPSBT is required").notEmpty(),

  async (req: Request, res: Response) => {
    try {
      // Validate Form Inputs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(500).json({ error: errors.array() });
      }
      // Getting parameter from request
      let { ordinalId, signedBuyerPSBT } = req.body;

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

      // Extract Seller Psbt Base64 code from hex
      const SellerPsbtBase64: string = Bitcoin.Psbt.fromHex(
        ordinalData.signedListingPSBT as string
      ).toBase64();

      // Extract Buyer Psbt Base64 code from hex
      const BuyerPsbtBase64: string = Bitcoin.Psbt.fromHex(
        signedBuyerPSBT as string
      ).toBase64();

      // Join Psbt function
      const joinedPsbtbased64: string = await getJoinedPsbt(
        [SellerPsbtBase64, BuyerPsbtBase64],
        networkType
      );

      // Extract real Psbt, but not finalized
      const joinedPsbt: Bitcoin.Psbt =
        Bitcoin.Psbt.fromBase64(joinedPsbtbased64);

      // Finalize real psbt and extract transaction
      const psbtHex: string = joinedPsbt
        .finalizeAllInputs()
        .extractTransaction(true)
        .toHex();

      return res.status(200).send({ txHex: psbtHex });
    } catch (error: any) {
      console.log(error.message);
      return res.status(500).send({ error });
    }
  }
);

export default SubmitOfferRouter;

///////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - Signed Buyer Psbt Hex
 * 70736274ff0100fdaa010200000007af1138185711ffadcc448ec8e7e1b571429b0b686c7d0be2b68e08ef2f094f7d0100000000ffffffff4ad96b606deededef2acfd63e51ea7456c24ff72f5b15389787ce41ed5325c120100000000ffffffffd26796abdba8e85d1a5d9a69bb1e40e7615f0c8c7d323378a80a3f7c26a0c6220100000000ffffffff241c16be1cc91e407500625204d6402a9e21a962f6844b75b9d315f454dc34e60100000000ffffffffa9a84ba91549ef2486b8b8a47fa491dc90bb018102f263272ee20988c890c95a0100000000ffffffff1ce80bb76df772758c67d4fdfba51270cf61ee58b5ec7a1febf6ed124b04eeae0100000000ffffffff84d76e79ee2a3c655661c6b985091e9f2122977049f237b2ac8de231a8eaab9b0200000000ffffffff0322020000000000002251207c1b43035013f2888cb2a352f05a270a27c00f3d62800582924b1c1b4497170ce8030000000000002251205fdf7371d5711d7c2f3076973c1961413f5ee64d27d05488640374a309e0c726ffdc0100000000002251207c1b43035013f2888cb2a352f05a270a27c00f3d62800582924b1c1b4497170c000000000001012b7a1a0000000000002251207c1b43035013f2888cb2a352f05a270a27c00f3d62800582924b1c1b4497170c0113401295033e021c45e95f9dcc6e7d1aba6bb657ad66c0499a7fd9ce3c93fb0c132009ce4c5424b7b96c5414984a73d6b9459ae6341c271057529032070d1632b329011720cde4d7fa3f66b13c61279a3a78fd3623428bc69d7e65c770a0fdfd6ea3b0758d0001012b33170000000000002251207c1b43035013f2888cb2a352f05a270a27c00f3d62800582924b1c1b4497170c011340d4971b534c076324cabf994ba682a83928ddc0c42ae07b626a833faec57946d4dfad6e2837b2a75be94ad4f34fa4483796c1c42c1b7743bff58448b55f444035011720cde4d7fa3f66b13c61279a3a78fd3623428bc69d7e65c770a0fdfd6ea3b0758d0001012b3a2f0000000000002251207c1b43035013f2888cb2a352f05a270a27c00f3d62800582924b1c1b4497170c0113400906502e80093283c3d8bb37cb6bd3bd3737e8a0242578d11723b0c8605972805bde1c9d741f982c15a9e7a63f881059958f85f000c04f2d66c03dff7f2afeb1011720cde4d7fa3f66b13c61279a3a78fd3623428bc69d7e65c770a0fdfd6ea3b0758d0001012b33170000000000002251207c1b43035013f2888cb2a352f05a270a27c00f3d62800582924b1c1b4497170c011340bbc459c190c025cd9d6f985215417a2d5241251deb8ec686bf8cf46a505034d0df1cafdbc74640c5ec0823a292e82bf633d97fe88bbc12af4936a2a96c5ee155011720cde4d7fa3f66b13c61279a3a78fd3623428bc69d7e65c770a0fdfd6ea3b0758d0001012b47170000000000002251207c1b43035013f2888cb2a352f05a270a27c00f3d62800582924b1c1b4497170c0113404218c5d599e4e1760d75e84979dbdef200f8004f400e594faa7a824c56e3b2b440f7d58ea91f4e649d4863e56b624f8953947f6dbfba3489efe74eee23825702011720cde4d7fa3f66b13c61279a3a78fd3623428bc69d7e65c770a0fdfd6ea3b0758d0001012b33170000000000002251207c1b43035013f2888cb2a352f05a270a27c00f3d62800582924b1c1b4497170c01134041dd99b99007a047cffda20b00384f0e5f160976da01069b76e9ecfcc50111c8211e06200ae8db63734f017ca9116c36b8de38f8a6f0c244c5cb551a14562f69011720cde4d7fa3f66b13c61279a3a78fd3623428bc69d7e65c770a0fdfd6ea3b0758d0001012b77b20500000000002251207c1b43035013f2888cb2a352f05a270a27c00f3d62800582924b1c1b4497170c01134093e2facbcd7ebcb0cfe22f0e821ab503e6823f5f046b9b381f62a38bdc3a138f032b58da9aa34142c219f0b5779083f6e8001b925fa71c08e81208cb4234c614011720cde4d7fa3f66b13c61279a3a78fd3623428bc69d7e65c770a0fdfd6ea3b0758d00000000
 *
 * - Signed Seller Psbt Hex
 * 70736274ff01005e020000000170a6e661c44956513b2d287991dcfc64a502d0ee5c44783e7e714d7ac2f4d7bf0100000000ffffffff01a0860100000000002251207c1b43035013f2888cb2a352f05a270a27c00f3d62800582924b1c1b4497170c000000000001012b22020000000000002251207c1b43035013f2888cb2a352f05a270a27c00f3d62800582924b1c1b4497170c0113408a2e733456fc69d66ca12a17807a3037416fc2debd7156906c08c74ae500e4c412dd9f7fedca14dbf07b0bcc8cf00b24dc66a22921461a18f1d41a03b369de2c011720cde4d7fa3f66b13c61279a3a78fd3623428bc69d7e65c770a0fdfd6ea3b0758d0000
 */

///////////////////////////////////////////////////////////////////////////////////////////////////////////

import { getLedgerSigner } from "./ledger-signer";
import { getEoaSigner } from "./eoa-signer";

const signerType = process.env.SIGNER_TYPE;

export async function getSigner() {
  if (signerType == "ledger") {
    return getLedgerSigner();
  } else {
    return getEoaSigner();
  }
}

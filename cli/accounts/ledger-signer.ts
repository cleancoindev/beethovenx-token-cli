import { LedgerSigner } from "@ethersproject/hardware-wallets";
import { ethers } from "hardhat";

const accountId = process.env.LEDGER_ACCOUNT_ID;

const type = "hid";
const path = `m/44'/60'/0'/0/${accountId}`;

export async function getLedgerSigner() {
  return new LedgerSigner(ethers.providers.getDefaultProvider(), type, path);
}

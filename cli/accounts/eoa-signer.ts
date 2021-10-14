import { ethers, getNamedAccounts } from "hardhat";

export async function getEoaSigner() {
  const accounts = await getNamedAccounts();
  return ethers.getSigner(accounts.signer);
}

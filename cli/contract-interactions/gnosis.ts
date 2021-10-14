import Safe, {
  EthersAdapter,
  SafeAccountConfig,
  SafeFactory,
} from "@gnosis.pm/safe-core-sdk";
import { ethers } from "ethers";
import { getSigner } from "../accounts";
import { stdout } from "../utils/stdout";
import { scriptConfig } from "../cli-config";
import { network } from "hardhat";

const config = scriptConfig[network.config.chainId!];

const contractNetworks = {
  250: {
    safeProxyFactoryAddress: "0xc3C41Ab65Dabe3ae250A0A1FE4706FdB7ECEB951",
    multiSendAddress: "0xd1b160Ee570632ac402Efb230d720669604918e8",
    safeMasterCopyAddress: "0x87EB227FE974e9E1d3Bc4Da562e0Bd3C348c2B34",
  },
};
export async function createSafe(owners: string[], threshold: number) {
  const safeFactory = await SafeFactory.create({
    ethAdapter: await getAdapter(),
    contractNetworks,
  });

  const safeAccountConfig: SafeAccountConfig = { owners, threshold };

  const safeSdk: Safe = await safeFactory.deploySafe(safeAccountConfig);
  return safeSdk.getAddress();
}

export async function listSafeOwners(address: string) {
  const safeSdk: Safe = await Safe.create({
    ethAdapter: await getAdapter(),
    safeAddress: address,
    contractNetworks,
  });
  const owners = await safeSdk.getOwners();
  stdout.printInfo(owners.join("\n"));
}

export async function approveTransaction(safeAddress: string, txHash: string) {
  const safeSdk: Safe = await Safe.create({
    ethAdapter: await getAdapter(),
    safeAddress,
  });

  const approveTxResponse = await safeSdk.approveTransactionHash(txHash);
  await approveTxResponse.transactionResponse?.wait();
}

export async function executeTransaction(safeAddress: string, txHash: string) {
  // const safeSdk: Safe = await Safe.create({
  //   ethAdapter: await getAdapter(),
  //   safeAddress,
  // });
  //
  // const approveTxResponse = await safeSdk.executeTransaction(txHash);
  // await approveTxResponse.transactionResponse?.wait();
}

async function getAdapter() {
  const signer = await getSigner();

  return new EthersAdapter({
    ethers,
    signer,
  });
}

export const safeAddresses = config.safeAddresses;

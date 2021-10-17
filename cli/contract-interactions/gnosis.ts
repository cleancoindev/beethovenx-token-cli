import Safe, {
  ContractNetworksConfig,
  EthersAdapter,
  SafeAccountConfig,
  SafeFactory,
} from "@gnosis.pm/safe-core-sdk";
import { getSigner } from "../accounts";
import { stdout } from "../utils/stdout";
import { scriptConfig } from "../cli-config";
import { ethers, network } from "hardhat";

export type GnosisTransaction = {
  targetContract: {
    name: string;
    address: string;
  };
  targetFunction: {
    identifier: string;
    args: any[];
  };
  // eth sent with transaction
  value: string;
};

const config = scriptConfig[network.config.chainId!];

const contractNetworks: ContractNetworksConfig = {
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
    contractNetworks,
  });

  console.log("blabla");
  const approveTxResponse = await safeSdk.approveTransactionHash(txHash);
  await approveTxResponse.transactionResponse?.wait();
}

export async function executeTransaction(
  safeAddress: string,
  transaction: GnosisTransaction
) {
  // const safeSdk: Safe = await Safe.create({
  //   ethAdapter: await getAdapter(),
  //   safeAddress,
  //   contractNetworks,
  // });

  console.log(safeAddress);
  const safeSdk: Safe = await Safe.create({
    ethAdapter: await getAdapter(),
    safeAddress: safeAddress,
    contractNetworks,
  });
  const targetContract = await ethers.getContractAt(
    transaction.targetContract.name,
    transaction.targetContract.address
  );

  // encode function data with params
  const functionFragment = targetContract.interface.getFunction(
    transaction.targetFunction.identifier
  );
  const data = targetContract.interface.encodeFunctionData(
    functionFragment,
    transaction.targetFunction.args
  );
  console.log("create");
  stdout.printInfo(`to: ${targetContract.address}`);
  stdout.printInfo(`data: \n ${data}`);
  // const safeTransaction = await safeSdk.createTransaction({
  //   data,
  //   value: transaction.value,
  //   to: transaction.targetContract.address,
  // });
  //
  // console.log("done", JSON.stringify(safeTransaction));
  // const txHash = await safeSdk.getTransactionHash(safeTransaction);
  // console.log("tx", txHash);
  // const approveTxResponse = await safeSdk.executeTransaction(safeTransaction);
  // console.log("await");
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

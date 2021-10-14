import path from "path";
import fs from "fs";
import { ethers, network } from "hardhat";
import { scriptConfig } from "../cli-config";
import { manageTimelockTransaction } from "./time-lock-transactions";
import { StoredTimelockTransaction, TimelockTransactionAction } from "../types";

const storedTransactions: Record<
  string,
  StoredTimelockTransaction
  // eslint-disable-next-line @typescript-eslint/no-var-requires
> = require(`../../.timelock/transactions.${network.name}.json`);

const config = scriptConfig[network.config.chainId!];

export async function timelocked_setPendingTimelockAdmin(
  pendingAdminAddress: string,
  type: TimelockTransactionAction,
  eta: number
) {
  const [signer] = await ethers.getSigners();

  return manageTimelockTransaction(
    signer,
    {
      targetContract: {
        name: "Timelock",
        address: config.contractAddresses.Timelock,
      },
      targetFunction: {
        identifier: "setPendingAdmin",
        args: [pendingAdminAddress],
      },
      value: 0,
      eta,
    },
    type
  );
}

export async function setPendingTimelockAdmin(address: string) {
  const [signer] = await ethers.getSigners();
  const timelock = await ethers.getContractAt(
    "Timelock",
    config.contractAddresses.Timelock
  );
  const tx = await timelock.connect(signer).setPendingAdmin(address);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

export async function acceptAdmin() {
  const [signer] = await ethers.getSigners();
  const timelock = await ethers.getContractAt(
    "Timelock",
    config.contractAddresses.Timelock
  );
  const tx = await timelock.connect(signer).acceptAdmin();
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

export async function getTimelockAdmin() {
  const timelock = await ethers.getContractAt(
    "Timelock",
    config.contractAddresses.Timelock
  );
  return timelock.admin();
}

export async function getTimelockSettings() {
  const timelock = await ethers.getContractAt(
    "Timelock",
    config.contractAddresses.Timelock
  );
  const delay = await timelock.delay();
  const gracePeriod = await timelock.GRACE_PERIOD();
  const minimumDelay = await timelock.MINIMUM_DELAY();
  const maximumDelay = await timelock.MAXIMUM_DELAY();
  return {
    delay,
    gracePeriod,
    minimumDelay,
    maximumDelay,
  };
}

export async function executeTransaction(transactionId: string) {
  const [signer] = await ethers.getSigners();
  const transaction = storedTransactions[transactionId];
  const txHash = await manageTimelockTransaction(
    signer,
    transaction,
    "execute"
  );

  fs.writeFileSync(
    path.join(__dirname, `../../.timelock/transactions.${network.name}.json`),
    JSON.stringify({
      ...storedTransactions,
      [transactionId]: {
        ...transaction,
        executed: true,
        executeTxHash: txHash,
      },
    })
  );
  return txHash;
}

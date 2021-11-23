import path from "path";
import fs from "fs";
import { ethers, network } from "hardhat";
import {
  StoredTimelockTransaction,
  TimelockTransaction,
} from "../../cli/types";
import { config } from "../network-config";
import moment from "moment";
import { store } from "hardhat-deploy/dist/src/globalStore";

export type HexContractInteraction = {
  contract: string;
  data: string;
};

export async function queueTimelockTransaction(
  transaction: TimelockTransaction
): Promise<HexContractInteraction> {
  const timelockContract = await ethers.getContractAt(
    "Timelock",
    config.contractAddresses.Timelock
  );
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

  const timelockFunctionFragment =
    timelockContract.interface.getFunction("queueTransaction");

  storeQueuedTransaction(transaction);

  return {
    contract: timelockContract.address,
    data: timelockContract.interface.encodeFunctionData(
      timelockFunctionFragment,
      [
        transaction.targetContract.address,
        transaction.value,
        0,
        data,
        transaction.eta,
      ]
    ),
  };
}

export async function executeTimelockTransaction(
  transactionId: string
): Promise<HexContractInteraction> {
  const storedTransactions = getStoredTransactions();
  const transaction = storedTransactions[transactionId];
  const timelockContract = await ethers.getContractAt(
    "Timelock",
    config.contractAddresses.Timelock
  );
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

  const timelockFunctionFragment =
    timelockContract.interface.getFunction("executeTransaction");

  markExecutedTransaction(transactionId);

  return {
    contract: timelockContract.address,
    data: timelockContract.interface.encodeFunctionData(
      timelockFunctionFragment,
      [
        transaction.targetContract.address,
        transaction.value,
        0,
        data,
        transaction.eta,
      ]
    ),
  };
}

function storeQueuedTransaction(transaction: TimelockTransaction) {
  const storedTimelockTransaction: StoredTimelockTransaction = {
    ...transaction,
    executed: false,
  };
  const storedTransactions = getStoredTransactions();

  const lastId =
    Object.keys(storedTransactions)
      .map((val) => parseInt(val))
      .pop() ?? 0;

  fs.writeFileSync(
    path.join(
      __dirname,
      `../../.timelock/transactions-discord.${network.name}.json`
    ),
    JSON.stringify({
      ...storedTransactions,
      [`${lastId + 1}`]: storedTimelockTransaction,
    })
  );
}

function markExecutedTransaction(transactionId: string) {
  const storedTransactions: Record<
    string,
    StoredTimelockTransaction
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  > = getStoredTransactions();

  const transaction = storedTransactions[transactionId];
  fs.writeFileSync(
    path.join(
      __dirname,
      `../../.timelock/transactions-discord.${network.name}.json`
    ),
    JSON.stringify({
      ...storedTransactions,
      [transactionId]: {
        ...transaction,
        executed: true,
      },
    })
  );
}

export function getTimelockTransactions(onlyExecutable = true) {
  const storedTransactions = getStoredTransactions();
  let transactionIds = [];
  if (onlyExecutable) {
    transactionIds = Object.keys(storedTransactions).filter((transactionId) => {
      return (
        !storedTransactions[transactionId].executed &&
        moment().isSameOrAfter(
          moment.unix(storedTransactions[transactionId].eta)
        )
      );
    });
  } else {
    transactionIds = Object.keys(storedTransactions);
  }

  return transactionIds.map((id) => ({
    id,
    transaction: storedTransactions[id],
  }));
}

function getStoredTransactions() {
  const storedTransactions: Record<
    string,
    StoredTimelockTransaction
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  > = JSON.parse(
    fs.readFileSync(
      path.join(
        __dirname,
        `../../.timelock/transactions-discord.${network.name}.json`
      ),
      "utf-8"
    )
  );
  return storedTransactions;
}

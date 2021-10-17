import path from "path";
import fs from "fs";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";

import { scriptConfig } from "../cli-config";
import {
  StoredTimelockTransaction,
  TimelockTransaction,
  TimelockTransactionAction,
} from "../types";
import { stdout } from "../utils/stdout";
import inquirer from "inquirer";

const storedTransactions: Record<
  string,
  StoredTimelockTransaction
  // eslint-disable-next-line @typescript-eslint/no-var-requires
> = require(`../../.timelock/transactions.${network.name}.json`);

const config = scriptConfig[network.config.chainId!];

export async function queueTimelockTransaction(
  timelockAdmin: SignerWithAddress,
  transaction: TimelockTransaction,
  gnosis: boolean = true
): Promise<string> {
  // stdout.printInfo(`${type} transaction with ${JSON.stringify(transaction)}`);
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

  if (gnosis) {
    // currently possible only by manual interaction
    const timelockFunctionFragment =
      timelockContract.interface.getFunction("queueTransaction");
    stdout.printInfo(`Contract address: ${targetContract.address}`);
    stdout.printInfo(
      `Data: ${timelockContract.interface.encodeFunctionData(
        timelockFunctionFragment,
        [
          transaction.targetContract.address,
          transaction.value,
          0,
          data,
          transaction.eta,
        ]
      )}`
    );
    const answers = await inquirer.prompt([
      {
        name: "tx",
        type: "input",
        message: "transaction hash",
      },
    ]);
    storeQueuedTransaction(transaction, answers.tx);
    return "gnosis-transaction";
  } else {
    const tx = await timelockContract
      .connect(timelockAdmin)
      .queueTransaction(
        transaction.targetContract.address,
        transaction.value,
        0,
        data,
        transaction.eta
      );
    const receipt = await tx.wait();
    const txHash = receipt.transactionHash;
    storeQueuedTransaction(transaction, txHash);
    return txHash;
  }
}

export async function executeTimelockTransaction(
  timelockAdmin: SignerWithAddress,
  transactionId: string,
  gnosis: boolean = true
): Promise<string> {
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

  if (gnosis) {
    // currently possible only by manual interaction
    const answers = await inquirer.prompt([
      {
        name: "confirmed",
        type: "confirm",
        message: "Transaction executed",
      },
      {
        name: "tx",
        type: "input",
        message: "transaction hash",
        when: (answers) => answers.confirmed,
      },
    ]);
    if (answers.confirmed) {
      markExecutedTransaction(transactionId, answers.tx);
    }
    return "gnosis-transaction";
  } else {
    const tx = await timelockContract
      .connect(timelockAdmin)
      .executeTransaction(
        transaction.targetContract.address,
        transaction.value,
        0,
        data,
        transaction.eta
      );
    const receipt = await tx.wait();
    const txHash = receipt.transactionHash;
    markExecutedTransaction(transactionId, txHash);
    return txHash;
  }
}

function storeQueuedTransaction(
  transaction: TimelockTransaction,
  txHash: string
) {
  const storedTimelockTransaction: StoredTimelockTransaction = {
    ...transaction,
    queueTxHash: txHash,
    executed: false,
  };
  fs.writeFileSync(
    path.join(__dirname, `../../.timelock/transactions.${network.name}.json`),
    JSON.stringify({
      ...storedTransactions,
      [`${transaction.eta}-${transaction.targetContract.name}-${
        transaction.targetContract.address
      }-${
        transaction.targetFunction.identifier
      }-[${transaction.targetFunction.args.join(",")}]`]:
        storedTimelockTransaction,
    })
  );
}

function markExecutedTransaction(transactionId: string, txHash: string) {
  const transaction = storedTransactions[transactionId];
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
}

import dotenv from "dotenv";
import commander from "commander";
import { printNetwork } from "./utils/network";
import { stdout } from "./utils/stdout";
import { printCirculatingSupply } from "./contract-interactions/token";
import {
  approveTransaction,
  createSafe,
  executeTransaction,
  listSafeOwners,
  safeAddresses,
} from "./contract-interactions/gnosis";
import inquirer from "inquirer";
import { getTimelockTransactionIds } from "./utils/timelock";

dotenv.config();

const program = new commander.Command("gnosis-cli");

async function main() {
  program
    .command("create-safe")
    .description("create a new safe")
    .action(async () => {
      await printNetwork();
      const answers = await inquirer.prompt([
        {
          name: "owners",
          type: "input",
          message: "comma seperated list of owner addresses",
        },
        {
          name: "threshold",
          type: "input",
          message: "minimum number of signers of a tx",
        },
      ]);
      stdout.printStep(
        `Creating new safe with owners ${answers.owners} and threshold ${answers.threshold}`
      );
      const safeAddress = await createSafe(
        answers.owners.split(","),
        parseInt(answers.threshold)
      );
      stdout.printInfo(`Safe address: ${safeAddress}`);
      stdout.printStepDone();
    });

  program
    .command("list-safe-owners")
    .description("list owners of safe")
    .action(async () => {
      const answers = await inquirer.prompt([
        {
          name: "address",
          message: "select safe",
          type: "list",
          choices: safeAddresses,
        },
      ]);
      await listSafeOwners(answers.address);
    });

  program
    .command("approve-tx")
    .description("approve transaction")
    .action(async () => {
      const answers = await inquirer.prompt([
        {
          name: "address",
          message: "select safe",
          type: "list",
          choices: safeAddresses,
        },
        {
          name: "hash",
          message: "tx hash",
          type: "input",
        },
      ]);
      stdout.printStep(
        `Approving tx ${answers.hash} on safe ${answers.address}`
      );
      await approveTransaction(answers.address, answers.hash);
      stdout.printStepDone();
    });

  program
    .command("execute-tx")
    .description("execute transaction")
    .action(async () => {
      // const answers = await inquirer.prompt([
      //   {
      //     name: "address",
      //     message: "select safe",
      //     type: "list",
      //     choices: safeAddresses,
      //   },
      // ]);
      // await listSafeOwners(answers.address);
      await executeTransaction("0xce739F64D2CC2dd665eC59E8fDb18380Ca69c2B1", {
        targetContract: {
          name: "BeethovenxEarlyLudwigsNft",
          address: "0xb302a31fcfebaf7b5ecb5ca96e4035957257f765",
        },
        value: "0",
        targetFunction: {
          identifier: "mint",
          args: [
            "0xF0876d373c68642C2827518F73F630aC2D58058C",
            "ipfs://QmPYmGDuzdstCJX6dzES3JTL98NQtTM67i4jqsHWzgW2Dr",
          ],
        },
      });
    });

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  stdout.printError(error.message, error);
  process.exit(1);
});

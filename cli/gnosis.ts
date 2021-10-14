import dotenv from "dotenv";
import commander from "commander";
import { printNetwork } from "./utils/network";
import { stdout } from "./utils/stdout";
import { printCirculatingSupply } from "./contract-interactions/token";
import {
  createSafe,
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

  await program.parseAsync(process.argv);
}

main().catch((error) => {
  stdout.printError(error.message, error);
  process.exit(1);
});

import { scriptConfig } from "../cli/cli-config";
import { network } from "hardhat";

export const config = scriptConfig[network.config.chainId!];

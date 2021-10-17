import { ethers, network } from "hardhat";
import { scriptConfig } from "../cli-config";
import { queueTimelockTransaction } from "./time-lock-transactions";
import { BeethovenxMasterChef } from "../../types";
import { BigNumber } from "ethers";
import { stdout } from "../utils/stdout";

const config = scriptConfig[network.config.chainId!];

export async function addMasterChefPool(
  allocationPoints: number,
  lpTokenAddress: string,
  rewarderAddress: string
) {
  const chef = (await ethers.getContractAt(
    "BeethovenxMasterChef",
    config.contractAddresses.MasterChef
  )) as BeethovenxMasterChef;
  const tx = await chef.add(allocationPoints, lpTokenAddress, rewarderAddress);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

export async function timelocked_addMasterChefPool(
  allocationPoints: number,
  lpAddress: string,
  rewarderAddress: string,
  eta: number
) {
  const [signer] = await ethers.getSigners();
  return queueTimelockTransaction(signer, {
    targetContract: {
      name: "BeethovenxMasterChef",
      address: config.contractAddresses.MasterChef,
    },
    value: 0,
    targetFunction: {
      identifier: "add",
      args: [allocationPoints, lpAddress, rewarderAddress],
    },
    eta: eta,
  });
}

export async function setMasterChefPool(
  pid: number,
  allocationPoints: number,
  rewarderAddress: string,
  overwriteRewarder: boolean
) {
  const chef = (await ethers.getContractAt(
    "BeethovenxMasterChef",
    config.contractAddresses.MasterChef
  )) as BeethovenxMasterChef;
  const tx = await chef.set(
    pid,
    allocationPoints,
    rewarderAddress,
    overwriteRewarder
  );
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

export async function timelocked_setMasterChefPool(
  pid: number,
  allocationPoints: number,
  rewarderAddress: string,
  overwriteRewarder: boolean,
  eta: number
) {
  const [signer] = await ethers.getSigners();
  return queueTimelockTransaction(signer, {
    targetContract: {
      name: "BeethovenxMasterChef",
      address: config.contractAddresses.MasterChef,
    },
    value: 0,
    targetFunction: {
      identifier: "set",
      args: [pid, allocationPoints, rewarderAddress, overwriteRewarder],
    },
    eta: eta,
  });
}

export async function updateEmissionRate(beetsPerBlock: BigNumber) {
  const chef = (await ethers.getContractAt(
    "BeethovenxMasterChef",
    config.contractAddresses.MasterChef
  )) as BeethovenxMasterChef;
  const tx = await chef.updateEmissionRate(beetsPerBlock);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

export async function timelocked_updateEmissionRate(
  beetsPerBlock: BigNumber,
  eta: number
) {
  const [signer] = await ethers.getSigners();
  return queueTimelockTransaction(signer, {
    targetContract: {
      name: "BeethovenxMasterChef",
      address: config.contractAddresses.MasterChef,
    },
    value: 0,
    targetFunction: {
      identifier: "updateEmissionRate",
      args: [beetsPerBlock],
    },
    eta: eta,
  });
}

export async function setTreasuryAddress(address: string) {
  const chef = (await ethers.getContractAt(
    "BeethovenxMasterChef",
    config.contractAddresses.MasterChef
  )) as BeethovenxMasterChef;
  const tx = await chef.treasury(address);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

export async function timelocked_setTreasuryAddress(
  address: string,
  eta: number
) {
  const [signer] = await ethers.getSigners();
  return queueTimelockTransaction(signer, {
    targetContract: {
      name: "BeethovenxMasterChef",
      address: config.contractAddresses.MasterChef,
    },
    value: 0,
    targetFunction: {
      identifier: "treasury",
      args: [address],
    },
    eta: eta,
  });
}

export async function listPools() {
  const chef = (await ethers.getContractAt(
    "BeethovenxMasterChef",
    config.contractAddresses.MasterChef
  )) as BeethovenxMasterChef;
  const poolsLength = await chef.poolLength();
  for (let pid = 0; pid < poolsLength.toNumber(); pid++) {
    const { allocPoint, accBeetsPerShare, lastRewardBlock } =
      await chef.poolInfo(pid);
    const lpTokenAddess = await chef.lpTokens(pid);
    stdout.printInfo(`PID: ${pid}`);
    stdout.printInfo(`lpAddress: ${lpTokenAddess}`);
    stdout.printInfo(`allocationPoints: ${allocPoint.toString()}`);
    stdout.printInfo(`accBeetsPerShare: ${accBeetsPerShare.toString()}`);
    stdout.printInfo(`lastRewardBlock: ${lastRewardBlock.toString()}`);
    stdout.printInfo(`--------------------------------------------------`);
  }
}

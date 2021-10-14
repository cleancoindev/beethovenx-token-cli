import {BigNumber} from "ethers";

export function bn(amount: number, decimals: number = 18) {
    return BigNumber.from(amount).mul(BigNumber.from(10).pow(decimals))
}

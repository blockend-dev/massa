import {
  Args,
  JsonRpcProvider,
  SmartContract,
} from "@massalabs/massa-web3";
import { CONTRACT_ADDRESS } from "../constants";

const client = JsonRpcProvider.buildnet();

/**
 * Read-only contract call
 */
export const readContract = async (
  functionName: string,
  parameters: Args = new Args()
) => {
  const contract = new SmartContract(client, CONTRACT_ADDRESS);
  const result = await contract.read(functionName, parameters);
  return result.value; 
};

/**
 * Contract write (transaction)
 */
export const callContract = async (
  functionName: string,
  parameters: Args = new Args()
) => {
  const contract = new SmartContract(client, CONTRACT_ADDRESS);
  const result = await contract.call(functionName, parameters);
   await result.waitFinalExecution();

  return result;
};

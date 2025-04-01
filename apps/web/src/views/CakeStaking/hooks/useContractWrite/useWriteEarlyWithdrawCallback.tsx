import { getVeCakeContract } from 'utils/contractHelpers'
import { createWriteContractCallback } from './createWriteContractCallback'

export const useWriteEarlyWithdrawCallback = createWriteContractCallback(getVeCakeContract, 'earlyWithdraw')

import useCatchTxError from 'hooks/useCatchTxError'
import { usePublicNodeWaitForTransaction } from 'hooks/usePublicNodeWaitForTransaction'
import { atom, useAtom } from 'jotai'
import { useCallback, useMemo } from 'react'
import { GetContractFn } from 'utils/contractHelpers'
import { Abi, ContractFunctionArgs, ContractFunctionName } from 'viem'
import { WalletClient } from 'viem/_types/clients/createWalletClient'
import { useAccount, useWalletClient } from 'wagmi'

export const createWriteContractCallback = <
  TAbi extends Abi | readonly unknown[],
  TWalletClient extends WalletClient,
  TMethod extends ContractFunctionName<TAbi, 'nonpayable' | 'payable'>,
>(
  getContract: GetContractFn<TAbi, TWalletClient>,
  method: TMethod,
) => {
  const statusAtom = atom<string>('IDLE')
  const txHashAtom = atom<string>('')

  return () => {
    const { fetchWithCatchTxError, loading } = useCatchTxError()
    const contract = useMemo(() => {
      return getContract()
    }, [getContract])
    const { address: account } = useAccount()
    const [status, setStatus] = useAtom(statusAtom)
    const [txHash, setTxHash] = useAtom(txHashAtom)
    const { data: walletClient } = useWalletClient()
    const { waitForTransaction } = usePublicNodeWaitForTransaction()

    const callMethod = useCallback(
      async (
        // @ts-ignore
        ...args: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TMethod>
      ): Promise<
        | {
            hash: `0x${string}`
          }
        | undefined
      > => {
        // @ts-ignore
        const { request } = await contract.simulate[method](args, {
          account: account!,
          chain: contract.chain,
        })

        setStatus('PENDING')

        const hash = await walletClient?.writeContract({
          ...request,
          account,
        })
        setTxHash(hash ?? '')
        setStatus('CONFIRMING')

        if (hash) {
          const transactionReceipt = await waitForTransaction({ hash })
          setStatus(transactionReceipt?.status === 'success' ? 'CONFIRMED' : 'ERROR')
          return {
            hash,
          }
        }
        return undefined
      },
      [contract, account, setStatus, setTxHash, waitForTransaction, walletClient],
    )

    const caller = useCallback(
      (
        // @ts-ignore
        ...args: ContractFunctionArgs<TAbi, 'nonpayable' | 'payable', TMethod>
      ) => {
        return fetchWithCatchTxError(() => {
          // @ts-ignore
          return callMethod(...args)
        })
      },
      [callMethod],
    )

    return { callMethod: caller, status, txHash, loading }
  }
}

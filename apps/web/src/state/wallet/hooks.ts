import { Currency, CurrencyAmount, Native, Token } from '@pancakeswap/sdk'
import { useAllTokens } from 'hooks/Tokens'
import useNativeCurrency from 'hooks/useNativeCurrency'
import first from 'lodash/first'
import { useMemo } from 'react'
import { notEmpty } from 'utils/notEmpty'
import { Address, erc20Abi, isAddress } from 'viem'
import { useAccount, useBalance } from 'wagmi'
import { useMultipleContractSingleDataWagmi } from '../multicall/hooks'

/**
 * Returns a map of the given addresses to their eventually consistent BNB balances.
 */
export function useNativeBalances(account?: Address): CurrencyAmount<Native> | undefined {
  const native = useNativeCurrency()

  const { data: results } = useBalance({
    address: account,
    chainId: native?.chainId,
  })

  return useMemo(() => CurrencyAmount.fromRawAmount(native, results?.value ?? BigInt(0)), [results, native])
}

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalancesWithLoadingIndicator(
  address?: string,
  tokens?: (Token | undefined)[],
): [{ [tokenAddress: string]: CurrencyAmount<Token> | undefined }, boolean] {
  const validatedTokens: Token[] = useMemo(
    () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address || '')) ?? [],
    [tokens],
  )

  const validatedTokenAddresses = useMemo(() => validatedTokens.map((vt) => vt.address), [validatedTokens])

  // NOTE: assume all tokens have the same chainId
  const chainId = first(validatedTokens)?.chainId

  const { data: balances, isLoading } = useMultipleContractSingleDataWagmi({
    abi: erc20Abi,
    addresses: validatedTokenAddresses,
    functionName: 'balanceOf',
    args: useMemo(() => [address as Address] as const, [address]),
    options: {
      enabled: Boolean(address && validatedTokenAddresses.length > 0),
      chainId,
    },
  })

  // const balances = useMultipleContractSingleData({
  //   abi: erc20Abi,
  //   addresses: validatedTokenAddresses,
  //   functionName: 'balanceOf',
  //   args: useMemo(() => [address as Address] as const, [address]),
  //   options: {
  //     enabled: Boolean(address && validatedTokenAddresses.length > 0),
  //     chainId,
  //   },
  // })

  const aggregatedBalances = useMemo(
    () =>
      address && validatedTokens.length > 0
        ? validatedTokens.reduce<{ [tokenAddress: string]: CurrencyAmount<Token> | undefined }>((memo, token, i) => {
            const value = balances?.[i]?.result as bigint | undefined
            const amount = notEmpty(value) ? BigInt(value.toString()) : undefined
            if (typeof amount !== 'undefined') {
              memo[token.address] = CurrencyAmount.fromRawAmount(token, amount)
            }
            return memo
          }, {})
        : {},
    [address, validatedTokens, balances],
  )

  return useMemo(() => [aggregatedBalances, isLoading], [aggregatedBalances, isLoading])
}

export function useTokenBalances(
  address?: string,
  tokens?: (Token | undefined)[],
): { [tokenAddress: string]: CurrencyAmount<Token> | undefined } {
  return useTokenBalancesWithLoadingIndicator(address, tokens)[0]
}

// get the balance for a single token/account combo
export function useTokenBalance(account?: string, token?: Token): CurrencyAmount<Token> | undefined {
  const tokenBalances = useTokenBalances(
    account,
    useMemo(() => [token], [token]),
  )
  if (!token) return undefined
  return tokenBalances[token.address]
}

export function useCurrencyBalances(
  account?: string,
  currencies?: (Currency | undefined | null)[],
): (CurrencyAmount<Currency> | undefined)[] {
  const tokens = useMemo(
    () => currencies?.filter((currency): currency is Token => Boolean(currency?.isToken)) ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...(currencies ?? [])],
  )

  const tokenBalances = useTokenBalances(account, tokens)

  const containsNative: boolean = useMemo(
    () => currencies?.some((currency) => currency?.isNative) ?? false,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...(currencies ?? [])],
  )
  const uncheckedAddresses = useMemo(
    () => (containsNative ? (account as Address) : undefined),
    [containsNative, account],
  )
  const nativeBalance = useNativeBalances(uncheckedAddresses)

  return useMemo(
    () =>
      currencies?.map((currency) => {
        if (!account || !currency) return undefined
        if (currency?.isToken) return tokenBalances[currency.address]
        if (currency?.isNative) return nativeBalance
        return undefined
      }) ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [account, ...(currencies ?? []), nativeBalance, tokenBalances],
  )
}

export function useCurrencyBalance(account?: string, currency?: Currency | null): CurrencyAmount<Currency> | undefined {
  return useCurrencyBalances(
    account,
    useMemo(() => [currency], [currency]),
  )[0]
}

// mimics useAllBalances
export function useAllTokenBalances(): { [tokenAddress: string]: CurrencyAmount<Token> | undefined } {
  const { address: account } = useAccount()
  const allTokens = useAllTokens()
  const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens])
  const balances = useTokenBalances(account ?? undefined, allTokensArray)
  return balances ?? {}
}

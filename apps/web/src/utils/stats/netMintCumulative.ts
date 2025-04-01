import { DUNE_ENDPOINTS } from './endpoints'
import { fetchFromDune } from './request'
import { DuneResponse } from './types'

interface Row {
  ActualMint: number
  DeflationMinimum: number
  ExpectedMint: number
  Week: string
  blocks: number
  burn: number
  cumulative_net_mint: number
  devmint: number
  marketcollection: number
  net_mint: number
}

export const getNetMintCumulative = async () => {
  const response = await fetchFromDune(DUNE_ENDPOINTS.NET_MINT_CUMULATIVE)
  const data: DuneResponse<Row> = await response.json()

  const result = {
    timestamp: new Date(data.execution_ended_at).getTime(),
    data: data.result.rows
      .map((row: Row) => ({
        timestamp: new Date(row.Week).getTime(),
        cumulative_net_mint: row.cumulative_net_mint,
      }))
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp),
  }

  return result
}

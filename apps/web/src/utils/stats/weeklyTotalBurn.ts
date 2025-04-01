import { DUNE_ENDPOINTS } from './endpoints'
import { fetchFromDune } from './request'
import { DuneResponse } from './types'

interface Row {
  Date: string
  blocks: number
  burn: number
  burn_cake_usd: number
  mint: number
  net_mint: number
  net_mint_cake_usd: number
  net_mint_per_block: number
}

export const getWeeklyTotalBurn = async () => {
  const response = await fetchFromDune(DUNE_ENDPOINTS.WEEKLY_TOTAL_BURN)
  const data: DuneResponse<Row> = await response.json()

  const result = {
    timestamp: new Date(data.execution_ended_at).getTime(),
    data: data.result.rows
      .map((row: Row) => ({
        timestamp: new Date(row.Date).getTime(),
        burn: row.burn,
      }))
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp),
  }

  return result
}

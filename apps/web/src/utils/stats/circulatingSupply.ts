import { DUNE_ENDPOINTS } from './endpoints'
import { fetchFromDune } from './request'
import { DuneResponse } from './types'

interface Row {
  Circulating_Supply: number
  Total_Pools: number
  Total_Supply: number
  week: string
}

export const getCirculatingSupply = async () => {
  const response = await fetchFromDune(DUNE_ENDPOINTS.CIRCULATING_SUPPLY)
  const data: DuneResponse<Row> = await response.json()

  const result = {
    timestamp: new Date(data.execution_ended_at).getTime(),
    data: data.result.rows
      .map((row: Row) => ({
        timestamp: new Date(row.week).getTime(),
        circulating_supply: row.Circulating_Supply,
        total_supply: row.Total_Supply,
      }))
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp),
  }

  return result
}

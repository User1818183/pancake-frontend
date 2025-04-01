import { DUNE_ENDPOINTS } from './endpoints'
import { fetchFromDune } from './request'
import { DuneResponse } from './types'

interface Row {
  'Burn CAKE': number
  'Burn CAKE($)': number
  Product: string
  Week: string
}

export const getWeeklyBurnBreakdown = async () => {
  const response = await fetchFromDune(DUNE_ENDPOINTS.WEEKLY_BURN_BREAKDOWN)
  const data: DuneResponse<Row> = await response.json()

  const result = {
    timestamp: new Date(data.execution_ended_at).getTime(),
    data: data.result.rows
      .map((row: Row) => ({
        timestamp: new Date(row.Week).getTime(),
        burn: row['Burn CAKE'],
        burnUSD: row['Burn CAKE($)'],
        product: row.Product,
      }))
      .slice()
      .sort((a, b) => a.timestamp - b.timestamp),
  }

  return result
}

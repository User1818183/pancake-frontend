import { Text } from '@pancakeswap/uikit'
import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { Area, AreaChart, Bar, BarChart, Line, LineChart, Tooltip } from 'recharts'

export const BurnDashboard = () => {
  const chartRef = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ['burnStats'],
    queryFn: async () => {
      const response = await fetch('/api/stats')
      if (!response.ok) {
        throw new Error('Error while fetching burn statistics')
      }
      return response.json()
    },
    initialData: {},
  })

  const { netMintCumulative, circulatingSupply, netMintWeekly, weeklyTotalBurn, weeklyBurnBreakdown } = data

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-4">Burn Page</h1>
      <p className="text-lg">This is the burn page.</p>
      <div ref={chartRef} className="mt-8">
        &nbsp;
      </div>
      <Text>Net Mint Cumulative</Text>
      {netMintCumulative && (
        <AreaChart
          width={500}
          height={300}
          data={netMintCumulative?.data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <Area
            type="monotone"
            dataKey="cumulative_net_mint"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 8 }}
          />
          <Tooltip />
        </AreaChart>
      )}

      <Text>Circulating Supply</Text>
      {circulatingSupply && (
        <LineChart
          width={500}
          height={300}
          data={circulatingSupply?.data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <Line
            type="monotone"
            dataKey="circulating_supply"
            stroke="#aa5d12"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="total_supply"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 8 }}
          />
          <Tooltip />
        </LineChart>
      )}

      <Text>Net Mint Weekly</Text>
      {netMintWeekly && (
        <BarChart
          width={500}
          height={300}
          data={netMintWeekly?.data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <Bar type="monotone" dataKey="net_mint" fill="#8884d8" strokeWidth={2} />
          <Tooltip />
        </BarChart>
      )}

      <Text>Weekly Total Burn</Text>
      {weeklyTotalBurn && (
        <BarChart
          width={500}
          height={300}
          data={weeklyTotalBurn?.data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <Bar type="monotone" dataKey="burn" fill="#8884d8" strokeWidth={2} />
          <Tooltip />
        </BarChart>
      )}

      <Text>Weekly Burn Breakdown</Text>
      {weeklyBurnBreakdown && (
        <BarChart
          width={500}
          height={300}
          data={weeklyBurnBreakdown?.data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <Bar type="monotone" dataKey="burn" fill="#8884d8" strokeWidth={2} />
          <Tooltip />
        </BarChart>
      )}
    </div>
  )
}

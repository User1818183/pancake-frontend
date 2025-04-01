import { NextApiHandler } from 'next'
import {
  getCirculatingSupply,
  getNetMintCumulative,
  getNetMintWeekly,
  getWeeklyBurnBreakdown,
  getWeeklyTotalBurn,
} from 'utils/stats'

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const [netMintWeekly, netMintCumulative, circulatingSupply, weeklyTotalBurn, weeklyBurnBreakdown] =
      await Promise.all([
        getNetMintWeekly(),
        getNetMintCumulative(),
        getCirculatingSupply(),
        getWeeklyTotalBurn(),
        getWeeklyBurnBreakdown(),
      ])

    const result = {
      netMintWeekly,
      netMintCumulative,
      circulatingSupply,
      weeklyTotalBurn,
      weeklyBurnBreakdown,
    }

    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export default handler

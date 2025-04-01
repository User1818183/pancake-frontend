import { SUPPORT_CAKE_STAKING } from 'config/constants/supportChains'
import { VeCakeExit } from 'views/CakeStaking/VeCakeExit'

const VeCakeExitPage = () => <VeCakeExit />

VeCakeExitPage.chains = SUPPORT_CAKE_STAKING

export default VeCakeExitPage

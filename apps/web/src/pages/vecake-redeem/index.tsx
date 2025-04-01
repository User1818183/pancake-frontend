import { SUPPORT_CAKE_STAKING } from 'config/constants/supportChains'
import { VeCakeRedeem } from 'views/CakeStaking/VeCakeRedeem'

const VeCakeRedeemPage = () => <VeCakeRedeem />

VeCakeRedeemPage.chains = SUPPORT_CAKE_STAKING

export default VeCakeRedeemPage

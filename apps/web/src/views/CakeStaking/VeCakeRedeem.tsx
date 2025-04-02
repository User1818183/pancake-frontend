import { useTranslation } from '@pancakeswap/localization'
import { Box, Button, ChevronDownIcon, Flex, Link, Text } from '@pancakeswap/uikit'
import BigNumber from 'bignumber.js'
import ConnectWalletButton from 'components/ConnectWalletButton'
import Page from 'components/Layout/Page'
import { ASSET_CDN } from 'config/constants/endpoints'
import { WEEK } from 'config/constants/veCake'
import dayjs from 'dayjs'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useCakePrice } from 'hooks/useCakePrice'
import { useVeCakeBalance } from 'hooks/useTokenBalance'
import React, { useCallback, useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useCurrentBlockTimestamp } from 'state/block/hooks'
import styled from 'styled-components'
import { getRevenueSharingCakePoolAddress, getRevenueSharingVeCakeAddress } from 'utils/addressHelpers'
import { getRevenueSharingPoolGatewayContract } from 'utils/contractHelpers'
import { formatTime } from 'utils/formatTime'
import { poolStartWeekCursors } from 'views/CakeStaking/config'
import { RedeemHeader } from './components/RedeemHeader'
import { DisplayUSDValue, DisplayValue, VeCakeExitField } from './components/VeCakeExitField'
import { createWriteContractCallback } from './hooks/useContractWrite/createWriteContractCallback'
import { useWriteEarlyWithdrawCallback } from './hooks/useContractWrite/useWriteEarlyWithdrawCallback'
import { useRevenueSharingCakePool, useRevenueSharingVeCake } from './hooks/useRevenueSharingProxy'
import { useCakeLockStatus } from './hooks/useVeCakeUserInfo'

const useCakeExitInfo = () => {
  const { balance } = useVeCakeBalance()
  const { nativeCakeLockedAmount, proxyCakeLockedAmount, cakeUnlockTime } = useCakeLockStatus()
  const veCakeShare = useRevenueSharingVeCake()
  const cakePoolShare = useRevenueSharingCakePool()
  const cakePrice = useCakePrice()

  const availableClaim = BigNumber(veCakeShare.availableClaim).plus(cakePoolShare.availableClaim)

  const lockedCake = nativeCakeLockedAmount + proxyCakeLockedAmount

  const unlockTime = Number(dayjs.unix(Number(cakeUnlockTime || 0)))

  return {
    myVeCake: balance,
    lockedCake: BigNumber(lockedCake.toString()),
    endDate: unlockTime ? formatTime(unlockTime) : '-',
    availableClaim,
    availableClaimUSD: availableClaim.times(cakePrice),
    cakePoolRewards: BigNumber(cakePoolShare.availableClaim),
    veCakeRewards: BigNumber(veCakeShare.availableClaim),
    cakePrice: cakePrice.toNumber(),
  }
}

const useClaimAll = createWriteContractCallback(getRevenueSharingPoolGatewayContract, 'claimMultiple')
export const VeCakeRedeem: React.FC = () => {
  const {
    t,
    currentLanguage: { locale },
  } = useTranslation()

  const { account, chainId } = useAccountActiveChain()
  const isWalletConnected = !!account
  const {
    myVeCake,
    endDate,
    lockedCake,
    cakePrice,
    availableClaim,
    availableClaimUSD,
    cakePoolRewards,
    veCakeRewards,
  } = useCakeExitInfo()
  const userStaked = lockedCake.gt(0)

  const totalAmount = cakePoolRewards.plus(veCakeRewards).plus(lockedCake)
  const totalAmountUSD = totalAmount.times(cakePrice)
  const userHasRewards = isWalletConnected && (cakePoolRewards.gt(0) || veCakeRewards.gt(0))
  const earlyWithdraw = useWriteEarlyWithdrawCallback()
  const currentBlockTimestamp = useCurrentBlockTimestamp()
  const claimAll = useClaimAll()

  const buttonLabel = useMemo(() => {
    if (!isWalletConnected) return t('Connect Wallet')
    if (userStaked) return t('Redeem veCAKE')
    if (userHasRewards) return t('Claim Rewards')
    return t('All claimed')
  }, [t, isWalletConnected, userStaked, userHasRewards])

  const isButtonDisabled = useMemo(() => {
    if (!isWalletConnected) return false
    if (userStaked || userHasRewards) return false
    return true
  }, [isWalletConnected, userStaked, userHasRewards])

  const handleClick = useCallback(async () => {
    if (!account || !chainId || !currentBlockTimestamp) return
    if (userStaked) {
      await earlyWithdraw.callMethod(account, BigInt(lockedCake.toFixed(0)))
      return
    }

    if (userHasRewards) {
      const cakePoolAddress = getRevenueSharingCakePoolAddress(chainId)
      const cakePoolLength = Math.ceil((currentBlockTimestamp - poolStartWeekCursors[cakePoolAddress]) / WEEK / 52)
      const veCakeAddress = getRevenueSharingVeCakeAddress(chainId)
      const veCakePoolLength = Math.ceil((currentBlockTimestamp - poolStartWeekCursors[veCakeAddress]) / WEEK / 52)

      const revenueSharingPools = [
        ...Array(cakePoolLength).fill(cakePoolAddress),
        ...Array(veCakePoolLength).fill(veCakeAddress),
      ]

      await claimAll.callMethod(revenueSharingPools, account)
    }
  }, [earlyWithdraw, userStaked])
  const [expand, setExpand] = useState(false)

  return (
    <Bg>
      <Page title={t('veCake Redeem')}>
        <Container>
          <RedeemHeader />
          <StyledCard>
            <SectionTitle isMobile={isMobile}>{t('MY CAKE STAKING POSITION')}</SectionTitle>

            <FieldGroup>
              <VeCakeExitField
                label="My veCAKE"
                value={myVeCake}
                valueTooltip={
                  <>
                    {t(
                      'veCAKE is calculated with number of CAKE locked, and the remaining time against maximum lock time.',
                    )}

                    <LearnMore />
                  </>
                }
              />

              <VeCakeExitField
                label="My Locked CAKE"
                value={lockedCake}
                symbol="CAKE"
                valueStyles={{
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '120%',
                  textAlign: 'right',
                }}
                usdValue={lockedCake.times(cakePrice)}
              />

              <VeCakeExitField
                label="Unlock Date"
                value={
                  <>
                    <DateText
                      style={{
                        textDecoration: 'line-through',
                        fontSize: '16px',
                      }}
                    >
                      {endDate}
                    </DateText>
                    <Text style={{}}>{t('Anytime')}</Text>
                  </>
                }
              />

              <VeCakeExitField
                label={t('My Total rewards')}
                value={
                  <Flex
                    onClick={() => {
                      setExpand(!expand)
                    }}
                    style={{
                      cursor: 'pointer',
                    }}
                  >
                    <DisplayValue
                      value={availableClaim}
                      symbol="CAKE"
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                      }}
                    />
                    <ChevronDownIcon color="primary60" />
                  </Flex>
                }
                symbol="CAKE"
                usdValue={availableClaimUSD}
              />

              {expand && (
                <>
                  <SubField>
                    <VeCakeExitField label={t('CAKE Pool Rewards')} value={cakePoolRewards} symbol="CAKE" />
                    <VeCakeExitField label={t('Revenue Sharing Rewards')} value={veCakeRewards} symbol="CAKE" />
                  </SubField>
                </>
              )}
            </FieldGroup>

            <TotalRedeemBox>
              <Box>
                <RedeemIcon src={`${ASSET_CDN}/web/vecake/redeem-icon.png`} alt="redeem" />
              </Box>
              <Flex flex={1} flexDirection="row" justifyContent="space-between">
                <Box>
                  <RedeemTitle>{t('REDEEM NOW')}</RedeemTitle>
                  <RedeemLabel>{t('Total amount')}</RedeemLabel>
                  {/* <VeCakeExitField label="Total amount" value={totalAmount} symbol="CAKE" usdValue={totalAmountUSD} /> */}
                </Box>
                <Box>
                  <StyledRedeemValue symbol="CAKE" value={totalAmount} />
                  <DisplayUSDValue value={totalAmountUSD} />
                </Box>
              </Flex>
            </TotalRedeemBox>

            {isWalletConnected ? (
              <StyledButton fullWidth onClick={handleClick} disabled={isButtonDisabled}>
                {buttonLabel}
              </StyledButton>
            ) : (
              <ConnectWalletButton
                style={{
                  width: '100%',
                }}
              />
            )}
          </StyledCard>
        </Container>
      </Page>
    </Bg>
  )
}

const RedeemLabel = styled(Text)`
  font-family: Kanit;
  font-weight: 400;
  font-size: 14px;
  line-height: 120%;
  letter-spacing: 0px;
  vertical-align: middle;
  color: ${({ theme }) => theme.colors.textSubtle};
`

const StyledRedeemValue = styled(DisplayValue)`
  font-family: Kanit;
  font-weight: 600;
  font-size: 16px;
  line-height: 120%;
  letter-spacing: 0px;
  text-align: right;
  color: ${({ theme }) => theme.colors.secondary};
`

const RedeemIcon = styled.img`
  width: 46px;
  height: 55px;
  margin-right: 8px;
`

const TotalRedeemBox = styled(Box)`
  margin-bottom: 16px;
  margin-top: 8px;
  background: ${({ theme }) => theme.colors.gradientBubblegum};
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
  border-radius: 16px;
  padding-top: 8px;
  padding-right: 16px;
  padding-bottom: 8px;
  padding-left: 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
`

const DateText = styled(Text)`
  text-decoration: line-through;
  fontsize: 16px;
  color: ${({ theme }) => theme.colors.textDisabled};
`

const Bg = styled.div`
  background: ${({ theme }) => theme.colors.gradientBubblegum};
  min-height: 100vh;
`
const Container = styled.div`
  margin: 0 auto;
  max-width: 1200px;
`

// Styled Components
const StyledCard = styled(Box)`
  max-width: 550px;
  margin: 0 auto;
  padding: 24px;
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.backgroundAlt};
  border: 2px solid ${({ theme }) => theme.colors.primaryBright};
`

const SectionTitle = styled(Text)<{ isMobile: boolean }>`
  color: ${({ theme }) => theme.colors.secondary};
  margin-bottom: 16px;
  font-family: Kanit;
  font-weight: 600;
  font-size: 12px;
  line-height: 120%;
  letter-spacing: 3%;
  text-transform: uppercase;
`

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
`

const SubField = styled.div`
  padding: 16px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.colors.cardBorder};
`

const RedeemTitle = styled(Text)`
  color: ${({ theme }) => theme.colors.secondary};
  font-family: Kanit;
  font-weight: 600;
  font-size: 12px;
  line-height: 120%;
  letter-spacing: 3%;
  text-transform: uppercase;
`

const StyledButton = styled(Button)`
  font-weight: 600;
  width: 100%;
`

const LearnMore: React.FC<{ href?: string }> = ({
  href = 'https://docs.pancakeswap.finance/products/vecake/migrate-from-cake-pool#10ffc408-be58-4fa8-af56-be9f74d03f42',
}) => {
  const { t } = useTranslation()
  return (
    <Link href={href} color="text" external>
      {t('Learn More >>')}
    </Link>
  )
}

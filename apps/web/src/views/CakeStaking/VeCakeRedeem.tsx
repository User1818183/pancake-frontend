import { useTranslation } from '@pancakeswap/localization'
import { Box, Button, ChevronUpIcon, IconButton, Text } from '@pancakeswap/uikit'
import BigNumber from 'bignumber.js'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { WEEK } from 'config/constants/veCake'
import dayjs from 'dayjs'
import useAccountActiveChain from 'hooks/useAccountActiveChain'
import { useCakePrice } from 'hooks/useCakePrice'
import { useVeCakeBalance } from 'hooks/useTokenBalance'
import React, { useCallback, useMemo } from 'react'
import { isMobile } from 'react-device-detect'
import { useCurrentBlockTimestamp } from 'state/block/hooks'
import styled from 'styled-components'
import { getRevenueSharingCakePoolAddress, getRevenueSharingVeCakeAddress } from 'utils/addressHelpers'
import { getRevenueSharingPoolGatewayContract } from 'utils/contractHelpers'
import { formatTime } from 'utils/formatTime'
import { poolStartWeekCursors } from 'views/CakeStaking/config'
import { RedeemHeader } from './components/RedeemHeader'
import { VeCakeExitField } from './components/VeCakeExitField'
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

  return (
    <Bg>
      <Container>
        <RedeemHeader />
        <StyledCard>
          <SectionTitle isMobile={isMobile}>{t('MY CAKE STAKING POSITION')}</SectionTitle>

          <FieldGroup>
            <VeCakeExitField label="My veCAKE" value={myVeCake} symbol="veCake" />

            <VeCakeExitField label="My Locked CAKE" value={lockedCake} symbol="CAKE" />

            <VeCakeExitField
              label="Unlock Date"
              value={
                <>
                  <Text>{t('Anytime')}</Text>
                  <Text>{endDate}</Text>
                </>
              }
            />

            <VeCakeExitField
              label="My Total rewards"
              value={availableClaim}
              symbol="CAKE"
              usdValue={availableClaimUSD}
            />

            <ArrowButton>
              <ChevronUpIcon color="currentColor" />
            </ArrowButton>

            <SubField>
              <VeCakeExitField label="CAKE Pool Rewards" value={cakePoolRewards} symbol="CAKE" />
              <VeCakeExitField label="Revenue Sharing Rewards" value={veCakeRewards} symbol="CAKE" />
            </SubField>
          </FieldGroup>

          <DividerLine />

          <Box mb="16px" mt="8px">
            <RedeemTitle>{t('REDEEM NOW')}</RedeemTitle>
            <VeCakeExitField label="Total amount" value={totalAmount} symbol="CAKE" usdValue={totalAmountUSD} />
          </Box>

          {isWalletConnected ? (
            <StyledButton fullWidth onClick={handleClick} disabled={isButtonDisabled}>
              {buttonLabel}
            </StyledButton>
          ) : (
            <ConnectWalletButton />
          )}
        </StyledCard>
      </Container>
    </Bg>
  )
}

const Bg = styled.div`
  background: ${({ theme }) => theme.colors.gradientBubblegum};
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

const ArrowButton = styled(IconButton)`
  align-self: center;
  color: ${({ theme }) => theme.colors.textSubtle};
  background: transparent;
  box-shadow: none;

  &:hover {
    opacity: 0.7;
  }
`

const DividerLine = styled.div`
  margin: 16px 0;
  height: 1px;
  width: 100%;
  background: ${({ theme }) => theme.colors.cardBorder};
`

const RedeemTitle = styled(Text)`
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 4px;
`

const StyledButton = styled(Button)`
  font-weight: 700;
`

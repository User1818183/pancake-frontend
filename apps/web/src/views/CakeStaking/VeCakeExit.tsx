import { useTranslation } from '@pancakeswap/localization'
import { zeroAddress } from '@pancakeswap/price-api-sdk'
import { Box, Button, ChevronUpIcon, IconButton, Text, useToast } from '@pancakeswap/uikit'
import BigNumber from 'bignumber.js'
import ConnectWalletButton from 'components/ConnectWalletButton'
import { ToastDescriptionWithTx } from 'components/Toast'
import dayjs from 'dayjs'
import { useCakePrice } from 'hooks/useCakePrice'
import { useVeCakeBalance } from 'hooks/useTokenBalance'
import React, { useCallback, useMemo } from 'react'
import styled from 'styled-components'
import { formatTime } from 'utils/formatTime'
import { useAccount } from 'wagmi'
import { VeCakeExitField } from './components/VeCakeExitField'
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

export const VeCakeExit: React.FC = () => {
  const {
    t,
    currentLanguage: { locale },
  } = useTranslation()

  const { address: account } = useAccount()
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

  const { toastSuccess, toastError } = useToast()
  const totalAmount = cakePoolRewards.plus(veCakeRewards).plus(lockedCake)
  const totalAmountUSD = totalAmount.times(cakePrice)
  const userHasRewards = isWalletConnected && (cakePoolRewards.gt(0) || veCakeRewards.gt(0))
  const earlyWithdraw = useWriteEarlyWithdrawCallback()

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
    if (userStaked) {
      try {
        await earlyWithdraw.callMethod(zeroAddress, BigInt(lockedCake.toFixed(0)))
        toastSuccess(
          t('Success!'),
          <ToastDescriptionWithTx txHash={earlyWithdraw.txHash}>
            {t('You have successfully claimed your rewards.')}
          </ToastDescriptionWithTx>,
        )
      } catch (err: any) {
        console.error('Redeem error', err)
        toastError(`Redeem Error:${err.toString()}`)
      }
    }
  }, [])

  return (
    <StyledCard>
      <SectionTitle>{t('MY CAKE STAKING POSITION')}</SectionTitle>

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

        <VeCakeExitField label="My Total rewards" value={availableClaim} symbol="CAKE" usdValue={availableClaimUSD} />

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
  )
}

// Styled Components
const StyledCard = styled(Box)`
  padding: 48px;
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.backgroundAlt};
`

const SectionTitle = styled(Text)`
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 16px;
`

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
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

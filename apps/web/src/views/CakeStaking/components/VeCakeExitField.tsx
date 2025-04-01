import { useTranslation } from '@pancakeswap/localization'
import { Flex, Text, TooltipText } from '@pancakeswap/uikit'
import { getBalanceAmount } from '@pancakeswap/utils/formatBalance'
import BigNumber from 'bignumber.js'
import React, { ReactElement } from 'react'
import styled from 'styled-components'
import formatLocaleNumber from 'utils/formatLocaleNumber'

type FieldProps = {
  label: string
  labelTooltip?: string
  value: ReactElement | number | BigNumber
  symbol?: string
  usdValue?: number | BigNumber
}

const DisplayValue = ({
  value,
  symbol,
}: {
  value: number | ReactElement | BigNumber
  symbol?: string
}): ReactElement => {
  const {
    currentLanguage: { locale },
  } = useTranslation()
  if (!value) {
    return <ValueText>-</ValueText>
  }
  if (typeof value === 'number' || value instanceof BigNumber) {
    const val = value instanceof BigNumber ? getBalanceAmount(value).toNumber() : value

    const valueStr = formatLocaleNumber({
      number: val,
      locale,
      sigFigs: 4,
    })
    return (
      <ValueText>
        {valueStr}
        {symbol && <SymbolText>&nbsp;{symbol}</SymbolText>}
      </ValueText>
    )
  }
  return value
}

const DisplayUSDValue = ({ value }: { value?: number | BigNumber }): ReactElement => {
  const {
    currentLanguage: { locale },
  } = useTranslation()
  if (!value) {
    return <UsdValueText>-</UsdValueText>
  }
  const val = value instanceof BigNumber ? getBalanceAmount(value).toNumber() : value
  const formattedValue = formatLocaleNumber({
    number: val,
    locale,
    sigFigs: 4,
  })
  return <UsdValueText>{`$${formattedValue}`}</UsdValueText>
}

export const VeCakeExitField: React.FC<FieldProps> = ({ label, labelTooltip, value, symbol, usdValue }) => {
  const { t } = useTranslation()

  return (
    <FieldWrapper justifyContent="space-between" alignItems="flex-start">
      <LabelWrapper>
        <LabelText>
          {t(label)}
          {labelTooltip && <TooltipText ml="4px">{labelTooltip}</TooltipText>}
        </LabelText>
        <Divider />
      </LabelWrapper>

      <ValueWrapper>
        <DisplayValue value={value} symbol={symbol} />
        <DisplayUSDValue value={usdValue} />
      </ValueWrapper>
    </FieldWrapper>
  )
}

// Styled components
const FieldWrapper = styled(Flex)`
  width: 100%;
  padding: 8px 0;
`

const LabelWrapper = styled.div`
  display: flex;
  flex-direction: column;
`

const LabelText = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSubtle};
`

const Divider = styled.div`
  margin-top: 4px;
  width: 100%;
  border-bottom: 2px dotted ${({ theme }) => theme.colors.textDisabled};
`

const ValueWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`

const ValueText = styled(Text)`
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`

const SymbolText = styled.span`
  font-weight: 500;
`

const UsdValueText = styled(Text)`
  font-size: 14px;
  font-weight: 400;
  color: ${({ theme }) => theme.colors.textDisabled};
`

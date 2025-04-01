import { BurnDashboard } from 'views/BurnDashboard'
import Page from 'views/Page'

const Layout: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <Page>{children}</Page>
}

const BurnPage = () => {
  return <BurnDashboard />
}

BurnPage.Layout = Layout

export default BurnPage

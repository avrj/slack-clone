import React from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { node } from 'prop-types'
import { CookiesProvider } from 'react-cookie'

const AppContainer = ({ children }) => (
  <MuiThemeProvider>
    <CookiesProvider>{children}</CookiesProvider>
  </MuiThemeProvider>
)

AppContainer.propTypes = {
  children: node.isRequired,
}
export default AppContainer

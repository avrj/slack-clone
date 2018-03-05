import React from 'react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import { node } from 'prop-types'
import { CookiesProvider } from 'react-cookie'
import { Provider } from 'react-redux'
import { store, persistor } from './redux/stores/store'
import { PersistGate } from 'redux-persist/integration/react'

const AppContainer = ({ children }) => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <MuiThemeProvider>
        <CookiesProvider>{children}</CookiesProvider>
      </MuiThemeProvider>
    </PersistGate>
  </Provider>
)

AppContainer.propTypes = {
  children: node.isRequired,
}
export default AppContainer

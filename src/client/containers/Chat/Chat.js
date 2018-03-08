import React, { Component } from 'react'
import io from 'socket.io-client'
import { withRouter } from 'react-router-dom'
import { withCookies } from 'react-cookie'
import Drawer from 'material-ui/Drawer'
import AppBar from 'material-ui/AppBar'
import IconMenu from 'material-ui/IconMenu'
import IconButton from 'material-ui/IconButton'
import MenuItem from 'material-ui/MenuItem'
import Snackbar from 'material-ui/Snackbar'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import events from '../../../common/events'
import './Chat.css'
import ChatInput from './ChatInput'
import ChannelList from './ChannelList/ChannelList'
import UserList from './UserList/UserList'
import JoinChannelDialog from './JoinChannelDialog'
import UserProfile from './UserList/UserProfile'
import MessageList from './MessageList'
import ErrorHandler from './ErrorHandler'
import { shape, string } from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { actions as userActions } from '../../reducers/user'
import { actions as usersActions } from '../../reducers/users'
import { actions as channelsActions } from '../../reducers/channels'
import { actions as appActions } from '../../reducers/app'
import Cookies from 'js-cookie'

class App extends Component {
  componentWillMount () {
    const parseSessionId = authCookie => authCookie.split(':')[1].split('.')[0]
    const sessionId = parseSessionId(Cookies.get('express.sid'))

    this.props.connect_to_socket(sessionId)
  }

  join = channel => {
    const channelExists = channel => this.props.channels[channel]
    if (channelExists(channel)) {
      this.props.joinChannel(channel, this.props.channels)
    } else {
      this.props.emit(events.join, channel)
    }

    this.props.hideJoinChannelDialog()
  }

  leaveChannel = () => this.props.emit(events.leave, this.props.activeChannel)

  sendMsg = msg => {
    if (this.props.activeChannel) {
      this.props.sendMsgToChannelRequest(
        this.props.user,
        this.props.activeChannel,
        msg
      )
    } else {
      this.props.sendMsgToUserRequest(
        this.props.user,
        this.props.activeUser,
        msg
      )
    }
  }

  setActiveChannel = channel => {
    if (this.props.channels[channel].earlierMessagesLoadedBefore) {
      this.props.setNoNewMessagesForChannel(channel)
    } else {
      this.props.fetchChannelsMessagesAppend(channel)
    }
    this.props.setActiveChannel(channel)
    this.props.toggleDrawer(false)
  }

  setActiveUser = user => {
    this.props.setActiveUser(user)
    this.props.toggleDrawer(false)
  }

  signOut = () => this.props.logOutRequest()

  handleErrorSnackbarRequestClose = () => this.props.hideErrorSnackbar()

  toggleDrawerInverted = () => this.props.toggleDrawer(!this.props.showDrawer)

  toggleDrawer = showDrawer => this.props.toggleDrawer(showDrawer)

  showJoinChannelDialog = () => this.props.onShowJoinChannelDialog()

  getMessages = () => {
    const { users, channels, activeChannel, activeUser } = this.props

    return activeChannel
      ? channels[activeChannel].messages
      : users[activeUser] ? users[activeUser].messages : []
  }

  getAppBarTitle = () => {
    const { activeChannel, activeUser, user } = this.props

    return activeChannel
      ? `# ${activeChannel}`
      : `${activeUser}${activeUser === user ? ' (you)' : ''}`
  }

  renderChat = () => {
    const appBarOrigin = { horizontal: 'right', vertical: 'top' }

    const { users, channels, user, activeChannel, activeUser } = this.props

    const messages = this.getMessages()

    const appBarTitle = this.getAppBarTitle()

    return (
      <ErrorHandler
        isConnecting={this.props.isConnecting}
        isConnected={this.props.isConnected}
        isDisconnectedByClient={this.props.isDisconnectedByClient}
      >
        <Snackbar
          open={this.props.showErrorSnackbar}
          message={this.props.errorSnackbarText}
          autoHideDuration={4000}
          onRequestClose={this.handleErrorSnackbarRequestClose}
        />
        {this.props.showJoinChannelDialog && (
          <JoinChannelDialog join={this.join} />
        )}
        <Drawer
          docked={false}
          open={this.props.showDrawer}
          onRequestChange={this.toggleDrawer}
        >
          <div style={{ padding: '10' }}>
            <UserProfile loggedUser={user} />
            <ChannelList
              showJoinChannelDialog={this.showJoinChannelDialog}
              activeChannel={activeChannel}
              setActiveChannel={this.setActiveChannel}
              channels={channels}
            />
            <UserList
              title='Users'
              loggedUser={user}
              activeUser={activeUser}
              setActiveUser={this.setActiveUser}
              users={users}
            />
          </div>
        </Drawer>

        <div className='chat-wrapper'>
          <AppBar
            title={appBarTitle}
            iconElementRight={
              <IconMenu
                iconButtonElement={
                  <IconButton>
                    <MoreVertIcon />
                  </IconButton>
                }
                targetOrigin={appBarOrigin}
                anchorOrigin={appBarOrigin}
              >
                {activeChannel && (
                  <MenuItem
                    primaryText={`Leave # ${activeChannel}`}
                    onClick={this.leaveChannel}
                  />
                )}
                <MenuItem primaryText='Sign out' onClick={this.signOut} />
              </IconMenu>
            }
            onLeftIconButtonClick={this.toggleDrawerInverted}
          />
          <MessageList messages={messages} />
          <ChatInput sendMsg={this.sendMsg} />
        </div>
      </ErrorHandler>
    )
  }

  render () {
    return this.props.channels && this.props.users ? (
      <div className='App'>{this.renderChat()}</div>
    ) : (
      <div>Loading...</div>
    )
  }
}

const mapStateToProps = ({ users, channels, user, app }) => {
  return {
    users: users.users,
    channels: channels.channels,
    user: user.user,
    activeUser: user.activeUser,
    activeChannel: user.activeChannel,
    isConnecting: app.isConnecting,
    isConnected: app.isConnected,
    isDisconnectedByClient: app.isDisconnectedByClient,
    showErrorSnackbar: app.showErrorSnackbar,
    errorSnackbarText: app.errorSnackbarText,
    showJoinChannelDialog: app.showJoinChannelDialog,
    showDrawer: app.showDrawer,
  }
}

const mapDispatchToProps = dispatch => ({
  ...bindActionCreators(
    { ...userActions, ...usersActions, ...appActions, ...channelsActions },
    dispatch
  ),
})

export default connect(mapStateToProps, mapDispatchToProps)(
  withRouter(withCookies(App))
)

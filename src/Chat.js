import React, { Component } from 'react';
import io from 'socket.io-client';
import './App.css';
import Channel from './Channel';
import ChatInput from './ChatInput';
import ChannelList from './ChannelList';
import UserList from './UserList';
import JoinChannelDialog from './JoinChannelDialog';
import Dialog from 'material-ui/Dialog';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import UserProfile from './UserProfile';
import { browserHistory } from 'react-router';
import events from '../events';

class App extends Component {
  constructor() {
    super();

    this.initialState = {
      users: {},
      channels: {},
      activeChannel: null,
      activeUser: null,
      loggedUser: null,
      showDrawer: false,
      drawerDocked: false,
      connecting: true,
      connected: false,
      disconnectedByClient: false,
    };

    this.state = this.initialState;

    this.client = io();

    this.client.on(events.connect, this._handleConnect);
    this.client.on(events.disconnect, this._handleDisconnect);
    this.client.on(events.error, this._handleError);
    this.client.on(events.online, this._handleOnline);
    this.client.on(events.offline, this._handleOffline);
    this.client.on(events.join, this._handleJoin);
    this.client.on(events.leave, this._handleLeave);
    this.client.on(events.msg, this._handleMsg);
    this.client.on(events.privateMsg, this._handlePrivateMsg);
    this.client.on(events.ownPrivateMsg, this._handleOwnPrivateMsg);
  }

  componentWillMount = () => {
    this.setDrawerVisibilityByWindowWidth();
  }

  setDrawerVisibilityByWindowWidth = () => {
    const mql = window.matchMedia('(min-width: 800px)');

    mql.addListener(this.onWindowWidthChange);

    this.setState({
      mql,
      showDrawer: mql.matches,
      drawerDocked: mql.matches,
    });
  }

  componentWillUnmount = () => {
    this.state.mql.removeListener(this.onWindowWidthChange);
  }

  onWindowWidthChange = () => {
    this.setState({
      showDrawer: this.state.mql.matches,
      drawerDocked: this.state.mql.matches,
    });
  }

  _handleConnect = () => {
    fetch('/users',
      {
        credentials: 'include',
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
            .then(response => response.json())
            .then((responseJson) => {
              if (!localStorage.getItem('loggedUser')) {
                localStorage.setItem('loggedUser', this.props.location.state.username);
              }

              const loggedUser = localStorage.getItem('loggedUser');

              const users = {};

              for (let i = 0; i < responseJson.length; i++) {
                users[responseJson[i].local.username] = { online: responseJson[i].local.online, messages: [] };
              }

              fetch('/user/channels',
                {
                  credentials: 'include',
                  method: 'GET',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                  },
                })
                    .then(response => response.json())
                    .then((responseJson) => {
                      const channels = {};

                      for (let i = 0; i < responseJson.local.channels.length; i++) {
                        channels[responseJson.local.channels[i]] = {
                          messages: [],
                          earlierMessagesLoadedBefore: false,
                        };
                      }

                      const activeChannel = localStorage.getItem('activeChannel') ? localStorage.getItem('activeChannel') : Object.keys(channels)[0];

                      if (localStorage.getItem('activeUser')) {
                        this.setState({
                          activeChannel: null,
                          activeUser: localStorage.getItem('activeUser'),
                          loggedUser,
                          users,
                          connected: true,
                          connecting: false,
                          channels,
                        });
                      } else {
                        fetch(`/channel/${localStorage.getItem('activeChannel')}/messages`,
                          {
                            credentials: 'include',
                            method: 'GET',
                            headers: {
                              Accept: 'application/json',
                              'Content-Type': 'application/json',
                            },
                          })
                                .then(response => response.json())
                                .then((responseJson) => {
                                  const messages = [];

                                  for (let i = 0; i < responseJson.length; i++) {
                                    messages.push({
                                      date: responseJson[i].timestamp,
                                      user: responseJson[i].user,
                                      msg: responseJson[i].text,
                                    });
                                  }

                                    // const channels = JSON.parse(JSON.stringify(this.state.channels));

                                  channels[localStorage.getItem('activeChannel')] = {
                                    hasNewMessages: false,
                                    earlierMessagesLoadedBefore: true,
                                    messages: messages.concat(channels[localStorage.getItem('activeChannel')].messages),
                                  };

                                  this.setState({
                                    activeChannel: localStorage.getItem('activeChannel'),
                                    activeUser: null,
                                    loggedUser,
                                    users,
                                    connected: true,
                                    connecting: false,
                                    channels,
                                  });
                                })
                                .catch((error) => {
                                  alert(`Error retrieving channels messages: ${error}`);
                                });
                      }
                    })
                    .catch((error) => {
                      alert('Error retrieving user\'s channels');
                    });
            })
            .catch((error) => {
              alert('Error retrieving users: ' + error);
            });
  }

  _handleDisconnect = () => {
    this.setState({ connected: false });
  }

  _handleError = (error) => {
    if (error == 'Unauthorized') {
      browserHistory.push({
        pathname: '/',
        state: {
          message: 'Please sign in to enter the chat.',
        },
      });
    } else {
      alert(`We've encountered an unexpected error: ${error}`);
    }
  }

  _handleJoin = (channel) => {
    fetch(`/channel/${channel}/messages`,
      {
        credentials: 'include',
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
            .then(response => response.json())
            .then((responseJson) => {
              const messages = [];

              for (let i = 0; i < responseJson.length; i++) {
                messages.push({
                  date: responseJson[i].timestamp,
                  user: responseJson[i].user,
                  msg: responseJson[i].text,
                });
              }

              const channels = JSON.parse(JSON.stringify(this.state.channels));

              channels[channel] = {
                hasNewMessages: false,
                earlierMessagesLoadedBefore: true,
                messages,
              };

              this.setState({
                channels,
                activeChannel: channel,
                activeUser: null,
              });

              localStorage.setItem('activeChannel', channel);
              localStorage.removeItem('activeUser');
            })
            .catch((error) => {
              alert(`Error retrieving channels messages: ${error}`);
            });
  };

  _handleMsg = (msg) => {
    if (!this.state.channels[msg.room]) return;

    const channels = JSON.parse(JSON.stringify(this.state.channels));

    const messages = channels[msg.room].messages;

    messages.push(msg);

    if (msg.room !== this.state.activeChannel && msg.user !== this.state.loggedUser) {
      channels[msg.room].hasNewMessages = true;
    }

    this.setState({ channels });
  };

  _handleOnline = (user) => {
    const users = JSON.parse(JSON.stringify(this.state.users));

    if (users[user]) {
      users[user].online = true;
    } else {
      users[user] = { online: true, messages: [] };
    }

    this.setState({ users });
  };

  _handleOffline = (user) => {
    const users = JSON.parse(JSON.stringify(this.state.users));

    users[user].online = false;

    this.setState({ users });
  }

  _handlePrivateMsg = (data) => {
    const users = JSON.parse(JSON.stringify(this.state.users));

    if (users[data.from]) {
      const messages = users[data.from].messages;

      messages.push({
        user: data.from,
        msg: data.msg,
      });


      if (this.state.activeUser !== data.from) {
        users[data.from].hasNewMessages = true;
      }

      this.setState({ users });
    } else {
      users[data.from] = { messages: [{ user: data.from, msg: data.msg }] };

      if (this.state.activeUser !== data.from) {
        users[data.from].hasNewMessages = true;
      }

      this.setState({
        users,
      });
    }
  };

  _handleOwnPrivateMsg = (data) => {
    const users = JSON.parse(JSON.stringify(this.state.users));

    if (users[data.to]) {
      const messages = users[data.to].messages;

      messages.push({
        user: this.state.loggedUser,
        msg: data.msg,
      });

      this.setState({
        users,
      });
    } else {
      users[data.to] = { messages: [{ user: this.state.loggedUser, msg: data.msg }] };
      this.setState({
        users,
      });
    }
  };

  join = (channelToJoin) => {
    if (this.state.channels[channelToJoin]) {
      this.setState({ activeChannel: channelToJoin, activeUser: null });
    } else {
      this.client.emit('join', channelToJoin);
    }
  }

  leaveChannel = () => {
    this.client.emit('leave', this.state.activeChannel);
  }

  _handleLeave = (channel) => {
    const channels = JSON.parse(JSON.stringify(this.state.channels));

    delete channels[channel];

    const channelNames = Object.keys(channels);

    this.setState({
      channels,
    });

    if (channel == this.state.activeChannel) {
      this.setState({
        activeChannel: channelNames.length > 0 ? channelNames[0] : null,
        activeUser: channelNames.length === 0 ? this.state.loggedUser : null,
      });

      if (channelNames.length > 0) {
        localStorage.setItem('activeChannel', channelNames[0]);
      } else {
        localStorage.removeItem('activeChannel');
      }
    }
  }

  sendMsg = (msg) => {
    if (this.state.activeChannel) {
      this.client.emit(events.msg, { room: this.state.activeChannel, msg });
    } else {
      this.client.emit(events.privateMsg, { to: this.state.activeUser, msg });
    }
  }


  renderChannel = () => {
    if (this.state.activeChannel) {
      if (!this.state.activeChannel) return null;

      if (this.state.channels[this.state.activeChannel]) {
        return (
          <Channel
            messages={this.state.channels[this.state.activeChannel].messages}
          />);
      }
    } else {
      return (<Channel
        messages={this.state.users[this.state.activeUser] ? this.state.users[this.state.activeUser].messages : []}
      />);
    }
  };

  setActiveChannel = (channel) => {
    if (this.state.channels[channel].earlierMessagesLoadedBefore) {
      const channels = JSON.parse(JSON.stringify(this.state.channels));

      channels[channel].hasNewMessages = false;

      this.setState({ channels });


      this.setState({
        activeChannel: channel,
        activeUser: null,
        showDrawer: this.state.mql.matches,
      });

      localStorage.setItem('activeChannel', channel);
      localStorage.removeItem('activeUser');
    } else {
      fetch(`/channel/${channel}/messages`,
        {
          credentials: 'include',
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        })
                .then(response => response.json())
                .then((responseJson) => {
                  const messages = [];

                  for (let i = 0; i < responseJson.length; i++) {
                    messages.push({
                      date: responseJson[i].timestamp,
                      user: responseJson[i].user,
                      msg: responseJson[i].text,
                    });
                  }

                  const channels = JSON.parse(JSON.stringify(this.state.channels));

                  channels[channel] = {
                    hasNewMessages: false,
                    earlierMessagesLoadedBefore: true,
                    messages: messages.concat(this.state.channels[channel].messages),
                  };

                  this.setState({
                    channels,
                    activeChannel: channel,
                    activeUser: null,
                    showDrawer: this.state.mql.matches,
                  });

                  localStorage.setItem('activeChannel', channel);
                  localStorage.removeItem('activeUser');
                })
                .catch((error) => {
                  alert('Error retrieving channels messages');
                });
    }
  }

  setActiveUser = (user) => {
    const users = JSON.parse(JSON.stringify(this.state.users));

    if (users[user]) users[user].hasNewMessages = false;

    this.setState({
      users,
      activeChannel: null,
      activeUser: user,
      showDrawer: this.state.mql.matches,
    });

    localStorage.setItem('activeUser', user);
    localStorage.removeItem('activeChannel');
  }

  signOut = () => {
    this.client.disconnect();

    const itemsToRemove = ['activeChannel', 'activeUser', 'loggedUser'];

    itemsToRemove.map(item => localStorage.removeItem(item));

    this.setState(Object.assign({}, this.initialState, { disconnectedByClient: true }));

    return fetch('/logout',
      {
        credentials: 'include',
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
            .then(response => response.json())
            .then((responseJson) => {
              if (responseJson.success) {
                browserHistory.push({
                  pathname: '/',
                  state: {
                    message: 'You are now signed out.',
                  },
                });
              } else {
                alert('Unexpected error while trying to sign out');
              }
            })
            .catch((error) => {
              alert(`Unexpected error while trying to sign out: ${error}`);
            });
  }

  renderChat = () => {
    const { loggedUser, activeChannel, activeUser } = this.state;

    if (this.state.connecting) {
      return (<Dialog
        title="Connecting"
        modal
        open
      >Just a sec...</Dialog>);
    } else if (this.state.connected) {
      return (<div style={{ height: '100%' }}>
        {this.state.showJoinChannelDialog && <JoinChannelDialog
          join={(channel) => {
            this.join(channel);
            this.setState({ showDrawer: false, showJoinChannelDialog: false });
          }}
        />}
        <Drawer
          docked={this.state.drawerDocked}
          open={this.state.showDrawer}
          onRequestChange={showDrawer => this.setState({ showDrawer })}
        >
          <UserProfile loggedUser={loggedUser} />
          <ChannelList
            showJoinChannelDialog={() => this.setState({ showJoinChannelDialog: true })}
            activeChannel={activeChannel}
            setActiveChannel={channel => this.setActiveChannel(channel)}
            channels={this.state.channels}
          />

          <UserList
            loggedUser={loggedUser}
            activeUser={activeUser}
            setActiveUser={user => this.setActiveUser(user)}
            users={this.state.users}
          />
        </Drawer>

        <div style={{ height: '90%' }}>
          <AppBar
            title={activeChannel ? `# ${activeChannel}` : `${activeUser}${activeUser === loggedUser ? ' (you)' : ''}`}
            iconElementRight={<IconMenu
              iconButtonElement={
                <IconButton><MoreVertIcon /></IconButton>
                            }
              targetOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
            >
              {activeChannel &&
                <MenuItem primaryText={`Leave #${activeChannel}`} onTouchTap={this.leaveChannel} />}
              <MenuItem primaryText="Sign out" onTouchTap={this.signOut} />
            </IconMenu>}
            onLeftIconButtonTouchTap={() => {
              this.setState({ showDrawer: !this.state.showDrawer });
            }}
          />
          {this.renderChannel()}</div>
        <div style={{ height: '10%' }}>{(activeChannel || activeUser) &&
        <ChatInput sendMsg={this.sendMsg} />}</div>
      </div>);
    } else if (this.state.disconnectedByClient) {
      return (<Dialog
        title="Disconnected by client"
        modal
        open
      >You are now disconnected.</Dialog>);
    }
    return (
      <Dialog
        title="Connection lost"
        modal
        open
      >You will be reconnected
                automatically if the chat server responds.</Dialog>);
  }


  render() {
    return (
      <div className="App">
        {this.renderChat()}
      </div>
    );
  }
}

export default App;

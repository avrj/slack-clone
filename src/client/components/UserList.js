import React, { Component } from 'react'
import UserListItem from './UserListItem'
import { string, object, func } from 'prop-types'

class UserList extends Component {
  render () {
    const renderListItems = () => {
      const { users } = this.props

      return Object.keys(users).map(user => {
        const you = user === this.props.loggedUser ? ' (you)' : ''

        return (
          <UserListItem
            active={this.props.activeUser === user}
            online={users[user].online}
            hasNewMessages={users[user].hasNewMessages}
            key={user}
            onClick={() => this.props.setActiveUser(user)}
            user={user + you}
          />
        )
      })
    }

    return (
      <div>
        <div className='DrawerListTitle'>{this.props.title}</div>

        <div>{renderListItems()}</div>
      </div>
    )
  }
}

UserList.propTypes = {
  title: string.isRequired,
  activeUser: string,
  loggedUser: string.isRequired,
  users: object.isRequired,
  setActiveUser: func.isRequired,
}

UserList.defaultProps = {
  activeUser: null,
}

export default UserList

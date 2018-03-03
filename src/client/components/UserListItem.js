import React from 'react'
import classNames from 'classnames'
import MenuItem from 'material-ui/MenuItem'
import PersonOutline from 'material-ui/svg-icons/social/person-outline'
import FontIcon from 'material-ui/FontIcon'
import { green500 } from 'material-ui/styles/colors'
import { func, string, bool } from 'prop-types'

const UserListItem = ({ active, hasNewMessages, onClick, online, user }) => (
  <MenuItem
    className={classNames({
      MenuItemActive: active,
      HasNewMessages: hasNewMessages,
    })}
    onClick={onClick}
  >
    {online ? (
      <FontIcon
        className={classNames('material-icons', 'VerticalAlignMiddle')}
        color={green500}
      >
        person
      </FontIcon>
    ) : (
      <PersonOutline className='VerticalAlignMiddle' />
    )}{' '}
    {user}
  </MenuItem>
)

UserListItem.propTypes = {
  onClick: func.isRequired,
  user: string.isRequired,
  active: bool,
  online: bool,
  hasNewMessages: bool,
}

UserListItem.defaultProps = {
  hasNewMessages: false,
  online: false,
  active: false,
}

export default UserListItem

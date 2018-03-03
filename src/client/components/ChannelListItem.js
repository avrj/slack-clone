import React from 'react'
import classNames from 'classnames'
import MenuItem from 'material-ui/MenuItem'
import { func, string, bool } from 'prop-types'

const ChannelListItem = ({ active, hasNewMessages, onClick, title }) => (
  <MenuItem
    className={classNames({
      MenuItemActive: active,
      HasNewMessages: hasNewMessages,
    })}
    onClick={onClick}
  >
    # {title}
  </MenuItem>
)

ChannelListItem.propTypes = {
  onClick: func.isRequired,
  title: string.isRequired,
  active: bool,
  hasNewMessages: bool,
}

ChannelListItem.defaultProps = {
  active: false,
  hasNewMessages: false,
}

export default ChannelListItem

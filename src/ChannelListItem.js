import React, { Component } from 'react';
import classNames from 'classnames';
import MenuItem from 'material-ui/MenuItem';

class ChannelListItem extends Component {
  render() {
    return (<MenuItem
      className={classNames({
        MenuItemActive: this.props.active,
        HasNewMessages: this.props.hasNewMessages,
      })}
      onTouchTap={this.props.onTouchTap}
    ># {this.props.title}</MenuItem>);
  }
}

ChannelListItem.propTypes = {
  onTouchTap: React.PropTypes.func.isRequired,
  title: React.PropTypes.string.isRequired,
  active: React.PropTypes.bool,
  hasNewMessages: React.PropTypes.bool,
};

export default ChannelListItem;

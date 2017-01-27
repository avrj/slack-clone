import React, { Component } from 'react';
import ChannelListItem from './ChannelListItem';
import AddCircle from 'material-ui/svg-icons/content/add-circle';
import IconButton from 'material-ui/IconButton';


class ChannelList extends Component {
  render() {
    const { channels } = this.props;

    const renderMenuItems = () => Object.keys(channels).map((key, i) => {
      const channel = channels[key];

      return (<ChannelListItem
        active={this.props.activeChannel === key}
        hasNewMessages={channel.hasNewMessages}
        key={i}
        onTouchTap={() => this.props.setActiveChannel(key)}
        title={key}
      />);
    });

    return (
      <div>
        <div className="DrawerListTitle">Channels <IconButton
          className="VerticalAlignMiddle"
          tooltip="Join channel"
          onTouchTap={this.props.showJoinChannelDialog}
        ><AddCircle /></IconButton></div>

        <div>
          {renderMenuItems()}
        </div>
      </div>
    );
  }
}

ChannelList.propTypes = {
  activeChannel: React.PropTypes.string,
  channels: React.PropTypes.object.isRequired,
  setActiveChannel: React.PropTypes.func.isRequired,
  showJoinChannelDialog: React.PropTypes.func.isRequired,
};

export default ChannelList;

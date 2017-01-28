import React, { Component } from 'react';
import Dialog from 'material-ui/Dialog';

class AttentionDialog extends Component {
  render() {
    return (
      <Dialog
        title={this.props.title}
        modal
        open
      >{this.props.text}</Dialog>
    );
  }
}

AttentionDialog.propTypes = {
  title: React.PropTypes.string.isRequired,
  text: React.PropTypes.string.isRequired,
};

export default AttentionDialog;

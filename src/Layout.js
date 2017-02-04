import React, { Component } from 'react';

const Sidebar = require('react-sidebar').default;

class Layout extends Component {
  constructor() {
    super();

    this.state = {
      open: false,
    };
  }

  onSetOpen = (open) => {
    this.setState({ open });
  }

  render() {
    return (
      <div>
        <Sidebar
          sidebar={<div style={{ backgroundColor: 'white', height: '100%', paddingLeft: '10', paddingRight: '10' }}>testi
                    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</div>}
          open={this.state.open} docked={false} onSetOpen={this.onSetOpen}
        >
          <b onClick={() => this.setState({ open: true })}>Mains content</b>
        </Sidebar>
      </div>

    );
  }
}

export default Layout;

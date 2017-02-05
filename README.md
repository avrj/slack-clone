[![Build Status](https://travis-ci.com/avrj/slack-clone.svg?token=YppLYpdczdMFqyvXVxYa&branch=master)](https://travis-ci.com/avrj/slack-clone)

# Slack clone
Stack: React, Socket.io, Node.js, MongoDB

# User stories
- Users can choose a nickname
- Users can join channels of their own
- Users can communicate privately with each other

## Features
- Mobile-friendly UI (Material-UI)
- Stores messages on the server (only messages from channels are saved at the moment, but it's quite easy to extend it to support private messages also)
- Supports multiple logged clients at the same time from one user (e.g. desktop & mobile)
- Authentication is done with Passport.js which makes other sign up methods easy to implement (e.g. Facebook OAuth)
- Highlights unread conversations

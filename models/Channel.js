

const mongoose = require('mongoose');

const channelSchema = mongoose.Schema({
  name: {
    type: mongoose.Schema.Types.String,
    unique: true,
    required: true,
  },
});

module.exports = mongoose.model('Channel', channelSchema);

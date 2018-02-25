const mongoose = require('mongoose')

const messageSchema = mongoose.Schema({
  timestamp: {
    type: mongoose.Schema.Types.Date,
    default: Date.now,
  },
  text: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
  channel: {
    type: mongoose.Schema.Types.String,
    required: true,
  },
})

messageSchema.pre('save', function (next) {
  this.channel = this.channel.toLowerCase()
  this.user = this.user.toLowerCase()

  next()
})

module.exports = mongoose.model('Message', messageSchema)

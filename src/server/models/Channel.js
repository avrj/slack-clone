const mongoose = require('mongoose')

const channelSchema = mongoose.Schema({
  name: {
    type: mongoose.Schema.Types.String,
    unique: true,
    required: true,
  },
})

channelSchema.pre('save', function (next) {
  this.name = this.name.toLowerCase()

  next()
})

module.exports = mongoose.model('Channel', channelSchema)

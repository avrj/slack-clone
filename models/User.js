

const bcrypt = require('bcrypt-nodejs');
const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  local: {
    username: {
      type: mongoose.Schema.Types.String,
      unique: true,
      required: true,
    },
    password: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    channels: [
      {
        type: mongoose.Schema.Types.String,
      },
    ],
    online: {
      type: mongoose.Schema.Types.Boolean,
      default: false,
    },
  },
});

UserSchema.pre('save', function(next) {
    this.local.username = this.local.username.toLowerCase();

    next();
});

UserSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

UserSchema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.local.password);
};

module.exports = mongoose.model('User', UserSchema);

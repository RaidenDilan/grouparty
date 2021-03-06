const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const s3 = require('../lib/s3');
const ObjectId = mongoose.Schema.ObjectId;
const validator = require('validator');
const avatar = 'https://www.searchpng.com/wp-content/uploads/2019/02/Profile-ICon.png';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, trim: true, lowercase: true, required: true },
  email: { type: String, unique: true, trim: true, lowercase: true, required: true },
  budget: { type: Number, required: true },
  password: { type: String, minLength: 1, required: true },
  profileImage: { type: String, default: avatar, required: true },
  githubId: { type: Number },
  group: { type: ObjectId, ref: 'Group', default: null } // Referenced Document
}, { timestamps: true });

userSchema.path('profileImage').set(function getPreviousImage(profileImage) {
  this._profileImage = this.profileImage;
  return profileImage;
});

userSchema.path('email').validate(validateEmail);

userSchema.virtual('profileImageSRC').get(function getProfileImageSRC() {
  if (!this.profileImage) return null;
  if (this.profileImage.match(/^http/)) return (this.profileImage);
  return `https://s3-eu-west-2.amazonaws.com/${ process.env.AWS_BUCKET_NAME }/${ this.profileImage }`;
});

userSchema.pre('save', function checkPreviousProfileImage(next) {
  if (this.isModified('profileImage') && this._profileImage) return s3.deleteObject({ Key: this._profileImage }, next);
  return next();
});

userSchema.pre('remove', function deleteImage(next) {
  if (this.profileImage) return s3.deleteObject({ Key: this.profileImage }, next);
  return next();
});

userSchema.virtual('passwordConfirmation').set(function setPasswordConfirmation(passwordConfirmation) {
  this._passwordConfirmation = passwordConfirmation;
});

userSchema.pre('validate', function checkPassword(next) {
  if (!this.password && !this.githubId) this.invalidate('password', 'required');
  if (this.isModified('password') && this._passwordConfirmation !== this.password) this.invalidate('passwordConfirmation', 'does not match');
  return next();
});

userSchema.pre('save', function hashPassword(next) {
  if (this.isModified('password')) this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync(11));
  return next();
});

userSchema.methods.validatePassword = function validatePassword(password) {
  return bcrypt.compareSync(password, this.password);
};

function validateEmail(email) {
  if (!validator.isEmail(email)) return this.invalidate('email', 'Email must be valid email address');
}

module.exports = mongoose.model('User', userSchema);

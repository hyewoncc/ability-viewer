const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const bookSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 100
    }
})

const tagSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    }
})

const userSchema = mongoose.Schema({
    id: {
        type: String,
        maxlength: 20
    },
    email: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        minlength: 8,
        maxlength: 30
    },
    books: [
        bookSchema
    ],
    tags: [
        tagSchema
    ],
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
});

userSchema.pre('save', function(next){
    let user = this;

    if(user.isModified('password')) {
        bcrypt.genSalt(saltRounds, function(err, salt){
            if(err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, function(err, hash) {
                if(err) {
                    return next(err);
                }
                user.password = hash;
                next();
            })
        })
    } else {
        next();
    }
});

userSchema.methods.comparePassword = function(plainPassword, cb) {
    bcrypt.compare(plainPassword, this.password, function(err, isMatch) {
        if(err) {
            return cb(err)
        }
        cb(null, isMatch)
    })
}

const User = mongoose.model('User', userSchema);

module.exports = { User };
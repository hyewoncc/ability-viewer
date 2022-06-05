const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const key = require('../config/key'); 

const tagSchema = mongoose.Schema({
    _id: {
        type: Object
    },
    name: {
        type: String,
        maxlength: 50
    }
})

const bookSchema = mongoose.Schema({
    _id: {
        type: Object
    },
    name: {
        type: String,
        maxlength: 100
    },
    tags: [
        tagSchema
    ]
},{ timestamps: true })

const userSchema = mongoose.Schema({
    id: {
        type: String,
        maxlength: 20,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        maxlength: 20,
        trim: true
    },
    password: {
        type: String
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

userSchema.methods.generateToken = function(cb) {
    let user = this;
    let token = jwt.sign({_id : user._id.toHexString()}, key.tokenKey, {
        expiresIn: '30 days'
    });
    user.token = token;
    user.save(function(err, user) {
        if(err) {
            return cb(err)
        }
        cb(null, user);
    });
}

userSchema.methods.saveBook = function(book, cb) {
    let user = this;
    let token = req.cookies.ability_auth;

    this.findByToken(token, (err, user) => {
        if(err) {
            return cb(err);
        }
        user.books.push(book, function(err) {
            if(err) {
                return cb(err)
            }
            cb(null, user);
        })
    })
}

userSchema.statics.findByToken = function(token, cb) {
    let user = this;

    jwt.verify(token, key.tokenKey, function(err, decoded) {
        user.findOne({ "_id": decoded, "token": token }, function(err, user) {
            if(err) {
                return cb(err);
            }
            cb(null, user);
        })
    })
}

const User = mongoose.model('User', userSchema);

module.exports = { User };
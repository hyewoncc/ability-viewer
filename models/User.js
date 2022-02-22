const mongoose = require('mongoose');

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
        minlength: 8
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

const User = mongoose.model('User', userSchema);

module.exports = { User };
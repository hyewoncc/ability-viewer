const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 100
    }
},{ timestamps: true })

const tagSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    books: [
        bookSchema
    ],
    user_id: {
    }
})

const Tag = mongoose.model('Tag', tagSchema);

module.exports = { Tag };

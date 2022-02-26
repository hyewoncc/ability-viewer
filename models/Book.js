const mongoose = require('mongoose');

const tagSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    }
})

const bookSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 100
    },
    text: {
        type: String,
        maxlength: 10000
    },
    tags: [
        tagSchema
    ],
},{ timestamps: true });

const Book = mongoose.model('Book', bookSchema);

module.exports = { Book };

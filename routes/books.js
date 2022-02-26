const express = require('express');
const router = express.Router();
const api = require('../config/api');

const { auth } = require('../middleware/auth');
const { Book } = require('../models/Book');
const { User } = require('../models/User');

router.get('/:_id', auth, function(req, res) {
    Book.findById(req.params._id, function(err, book) {
        if(err) {
            return res.status(500).json({
              message: "Server method failed",
              method: "DB - find a book"
            })
        }
        return res.status(200).json({
            name: book.name,
            text: book.text,
            tags: book.tags,
            links: {
                update: api.url + 'books/' + book._id,
                delete: api.url + 'books/' + book._id
            }
        })
    })
})

router.post('/', auth, function(req, res, next) {
    const book = new Book(req.body);
    book.save((err, bookInfo) => {
        if(err) {
            return res.status(500).json({
                message: "Server method failed"
            })
        }
        User.findOne({ _id: req.user._id }, (err, user) => {
            user.books.push(book);
            user.save((err) => {
                if(err) {
                    return res.status(500).json({
                        message: "Server method failed"
                    })
                }
            })
        })
        return res.status(201).json({
            success: true
        })
    })
})

module.exports = router;

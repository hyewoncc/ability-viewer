const express = require('express');
const router = express.Router();
const api = require('../config/api');

const { auth } = require('../middleware/auth');
const { Book } = require('../models/Book');
const { User } = require('../models/User');

router.post('/', auth, function(req, res, next) {
    const book = new Book(req.body);
    book.save((err, bookInfo) => {
        if(err) {
            return res.status(500).json({
                message: "Server method failed"
            })
        }
        User.findOne({ id: req.user.id }, (err, user) => {
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

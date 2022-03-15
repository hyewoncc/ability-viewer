const express = require('express');
const router = express.Router();
const api = require('../config/api');

const { auth } = require('../middleware/auth');
const { Book } = require('../models/Book');
const { Tag } = require('../models/Tag');
const { User } = require('../models/User');

router.get('/', auth, async(req, res) => {
    /*
    ** 쿼리 파라미터로 태그 id가 존재한다면 태그 기반 검색
    ** 없다면 사용자의 모든 책 검색 
    */
    const userId = req.user._id;
    const tagId = req.query.tag;
    
    try {
        if (tagId) {
            const targetTag =  await Tag.findById(tagId);
            const booksInTag = targetTag.books.toObject();
            booksInTag.forEach(book => {
                book.links = {
                    book: api.url + 'books/' + book._id,
                    delete: api.url + 'books/' + book._id
                };
                delete(book._id);
            });
            return res.status(200).json({
                books: booksInTag
            })
        }else {
            const targetUser = await User.findById(userId);
            const booksInUser = targetUser.books.toObject();
            booksInUser.forEach(book => {
                book.links = {
                    book: api.url + 'books/' + book._id,
                    delete: api.url + 'books/' + book._id
                };
                delete(book._id);
            });
            return res.status(200).json({
                books: booksInUser
            })
        }
        
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            message: "Server method failed"
        })
    }
})

router.get('/:_id', auth, function(req, res) {
    Book.findById(req.params._id, function(err, book) {
        if(err) {
            return res.status(500).json({
              message: "Server method failed"
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

router.post('/', auth, async(req, res, next) => {
    const book = new Book(req.body.book);
    const tags = req.body.tags;

    try {
        await book.save();
    
        const user = await User.findOne({ _id: req.user._id });
        user.books.push(book);

        if(tags.length === 0) {
            await user.save();
            return res.status(201).json({
                    success: true
            })
        }

        let tagcount = 0;

        for(const tagInfo of tags) {
            const userAlreadyHaveTag = await User.find(
                { _id: user._id, 'tags' : {'$elemMatch' : {'name': tagInfo.name}}}
            );
            if (!userAlreadyHaveTag.length) {
                const tag = new Tag(tagInfo);
                tag.books.push(book);
                tag.user_id = user._id;

                await tag.save();
                book.tags.push(tag);
                user.tags.push(tag);

            } else{
                const existTag = await Tag.find({user_id: user._id, name: tagInfo.name});
                existTag[0].books.push(book);
                book.tags.push({
                    name: existTag[0].name,
                    _id: existTag[0]._id
                });
                await existTag[0].save();
            }
            tagcount += 1;
        }
        
        
        if(tagcount === tags.length) {
            await book.save();
            await user.save();

            return res.status(201).json({
                success: true
            })
        }

    } catch(err) {
        return res.status(500).json({
            message: "Server method failed"
        })
    }
})

router.patch('/:_id', auth, async(req, res) => {
    try {
        const targetBook = await Book.findById(req.params._id);
        const updateBook = req.body.book;

        const user = await User.findById(req.user._id);

        targetBook.name = updateBook.name;
        targetBook.text = updateBook.text;

        const updateTags = req.body.tags;
        const preserveTags = [];
        const pullTagsId = [];

        for (const existTag of targetBook.tags) {
            let matchTag = updateTags.filter(tag => tag.name === existTag.name);
            if (matchTag.length === 0) {
                pullTagsId.push(existTag._id);
            }else {
                preserveTags.push(existTag);
            }
        }

        for (const preserveTag of preserveTags) {
            await Tag.findOneAndUpdate(
                { _id: preserveTag._id, "books._id": targetBook._id },
                { $set: { "books.$.name": targetBook.name }}
            );
        }

        await User.findOneAndUpdate(
            { _id: user._id, "books._id": targetBook._id },
            { $set: { "books.$.name": targetBook.name }}
        );

        await Book.findByIdAndUpdate(
            { _id: targetBook._id }, 
            { $pull: { tags: { _id: { $in: pullTagsId}}}}
        );

        for (const updateTag of updateTags) {
            let isExist = false;
            for (const oldTag of targetBook.tags ) {
                if (updateTag.name === oldTag.name) {
                    isExist = true;
                }
            }

            if (!isExist) {
                const originTagExist = await Tag.exists({user_id: user._id, name: updateTag.name});
                if (!originTagExist) {
                    const tag = new Tag(updateTag);
                    tag.books.push(targetBook);
                    tag.user_id = user._id;

                    const newTag = await tag.save();
                    targetBook.tags.push(newTag);
                    user.tags.push(newTag);
                } else {
                    const originTag = await Tag.findOne({user_id: user._id, name: updateTag.name});
                    originTag.books.push(targetBook);
                    await originTag.save();
                    targetBook.tags.push(originTag);
                }
            }
        }

        for (const pullTagId of pullTagsId) {
            const tag = await Tag.findById(pullTagId);
            if (tag.books.length === 1) {
                await tag.delete();
                await User.findByIdAndUpdate(
                        { _id: user._id },
                        { $pull: { tags: { _id: tag._id }}}
                    );
            } else {
                await Tag.findByIdAndUpdate(
                    { _id: pullTagId },
                    { $pull: { books: { _id: targetBook._id }}}
                )
            }
        }

        await targetBook.save();
        await user.save();

        return res.status(200).json({
            success: true
        })

    }catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Server method failed"
        })
    }
    
})

router.delete('/:_id', auth, async(req, res) => {
    try {
        const deletedBook = await Book.findByIdAndDelete(req.params._id);
        const targetuser = await User.findByIdAndUpdate({ _id: req.user._id },{ $pull: { books: { _id: deletedBook._id }}});

        for(const targetTag of deletedBook.tags) {
            const tag = await Tag.findById(targetTag._id);
            if (tag.books.length === 1) {
                const deletedTag = await tag.delete();
                await User.findByIdAndUpdate(
                    { _id: targetuser._id }, { $pull: { tags: { _id: deletedTag._id }}}
                );
            } else {
                await Tag.findByIdAndUpdate(
                    { _id: targetTag._id },
                    { $pull: { books: { _id: deletedBook._id }}}
                );


            }
        }

        return res.status(200).json ({
            success: true
        })
        
    }catch(err) {
        return res.status(500).json({
            message: "Server method failed"
        })
    }
});

module.exports = router;

const categoryRouter = require('express').Router();
const {createCategory} = require('../controller/categoryController')
const {authenticate, adminAuth} = require('../middleware/authentication');

categoryRouter.post('/category', authenticate, adminAuth, createCategory);
// categoryRouter.post('/category', createCategory);

module.exports = categoryRouter
const User = require('../models/user.js')
const {
    success,
    error,
} = require('../helpers/response.js')

exports.create = async (req, res) => {
    try {
        let result = await User.register(req.body)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.createAdmin = async (req, res) => {
    try {
        let result = await User.registerAdmin(req.body)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.auth = async (req, res) => {
    try {
        let result = await User.auth(req)
        success(res, result, 201)
    }
    catch (err) {
        error(res, err, 422)
    }
}

exports.update = async (req, res) => {
    try {
        console.log(req.body)
        let result = await User.dataUpdate(req.user._id, req)
        success(res, result, 201)
    }
    catch(err) {
        error(res, err, 422)
    }
}
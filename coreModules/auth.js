const func = require('./coreFunctions')
const con = require('./dbConnection')

// This document contains all of the express middleware for authentication to the routes and end points.

/**
 * Checks if the user is authenticated by passport.js, if they aren't it directs them to log in.
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
function isAuthorised(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/login')
    } else {
        next()
    }
}

/**
 * Checks if the user has the nessecary permissions to access a route, it is customisable such that you can specify an array of permissions that they can, and you can then specify if they need all of those permissions "AND" operating mode or "OR" operating mode if they only need one of them.
 * @param {Array} requiredPerms 
 * @param {String} logicType 
 * @returns {Function}
 */
function hasPermissions(requiredPerms, logicType = "AND") {
    return async (req, res, next) => {
        con.query("SELECT * FROM users WHERE userID = ?", [req.user], (err, results) => {
            if (err) {
                console.log(err)
                res.redirect('/login')
            } else {
                const user = results[0]
                if (func.hasPermissions(requiredPerms, user.perms, logicType)) {
                    next()
                } else {
                    res.redirect('/forbidden')
                }
            }
        })
    }
}

module.exports = {
    isAuthorised,
    hasPermissions
}


const func = require('./coreFunctions')
const con = require('./dbConnection')

function isAuthorised(req, res, next) {
    //will check if they are authorised by passport.js
    if (!req.isAuthenticated()) {
        res.redirect('/login')
    } else {
        next()
    }
}

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

function isAdmin(req, res, next) {
    con.query("SELECT * FROM users WHERE userID = ?", [req.user], (err, results) => {
        if (err) {
            console.log(err)
            res.redirect('/login')
        } else {
            const user = results[0]
            const userPermissions = func.decodePermissionBitmask(user.perms)

            next()
        }
    })
}

module.exports = {
    isAuthorised,
    hasPermissions,
    isAdmin
}


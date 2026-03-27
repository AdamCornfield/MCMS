const express = require('express')
const router = express.Router()
const auth = require('../coreModules/auth')
const con = require('../coreModules/dbConnection')
const func = require('../coreModules/coreFunctions')

// Admin Dashboard

router.get('/', (req, res) => {
    res.render('default', {
        isAuthenticated: req.isAuthenticated(),
        pagePath: 'admin/index',
        pageTitle: 'Admin Dashboard - MCMS'
    })
})

router.route('/manageUsers')
.get(auth.hasPermissions(["MANAGE_USERS"]), (req, res) => {
    // Fetch all users from the database
    con.query("SELECT * FROM users;", (err, users) => {
        if (err) console.error(err)

        // Filter out the password column
        let filteredUsers = func.filterColumns(users, ["password"])

        // Decode permission bitmask for each user
        for (let i = 0; i < filteredUsers.length; i++) {
            let perms = func.decodePermissionBitmask(filteredUsers[i].perms)
        }

        // Render the users page with the filtered user data
        res.render('default', {
            isAuthenticated: req.isAuthenticated(),
            pagePath: 'admin/users',
            pageTitle: 'Users - MCMS',
            columnNames: Object.keys(filteredUsers[0]), // Get column names to be used at the top of the table
            users: filteredUsers
        })
    })
})

router.route('/manageUsers/:userID')
.get(auth.hasPermissions(["MANAGE_USERS"]), (req, res) => {
    const userID = req.params.userID
    // Fetch user data from the database
    con.query("SELECT * FROM users WHERE userID = ?", [userID], (err, users) => {
        if (err) console.error(err)
        
        // Filter out the password column
        let filteredUsers = func.filterColumns(users, ["password"])

        const user = filteredUsers[0]

        res.render('default', {
            isAuthenticated: req.isAuthenticated(),
            pagePath: 'admin/profile',
            pageTitle: 'User Profile - MCMS',
            user: user
        })
    })
})

module.exports = router
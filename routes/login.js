// External Modules
const express = require('express')
const passport = require('passport')
const router = express.Router()
const bodyParser = require('body-parser')
const luxon = require('luxon')
const { v4: uuidv4 } = require('uuid');

// Custom Modules
const valid = require('../coreModules/validation')
const con = require('../coreModules/dbConnection')
const func = require('../coreModules/coreFunctions')

// Login and Registration Routes
let DateTime = luxon.DateTime

router.route('/')
.get((req, res) => {
    if (!req.isAuthenticated()) {
        res.render('default', {
            isAuthenticated: req.isAuthenticated(),
            valid: req.query.invalid ? 'Invalid username or password' : null,
            pagePath: 'core/login',
            pageTitle: 'Login - MCMS'
        })
    } else {
        res.redirect('/')
    }
})
.post(passport.authenticate('local', { failureRedirect: '/login?invalid=true', successRedirect: '/' }))

router.route('/register')
.get((req, res) => {
    if (!req.isAuthenticated()) {
        res.render('default', {
            isAuthenticated: req.isAuthenticated(),
            pagePath: 'core/register',
            pageTitle: 'Register - MCMS',
            errors: [],
            formData: {}
        })
    } else {
        res.redirect('/')
    }
})
.post((req, res) => {
    if (!req.isAuthenticated()) {
        let {
            firstName,
            lastName,
            username,
            DOB,
            email,
            password,
            confirmPassword,
            timezone
        } = req.body

        let errors = []

        // Convert checkboxes to boolean values
        const marketing = req.body.marketing === '1'
        const termsAccepted = req.body.terms === '1'

        // Sanitise Inputs to prevent XSS and other injection attacks
        firstName = valid.sanitiseInput(firstName || '')
        lastName = valid.sanitiseInput(lastName || '')
        username = valid.sanitiseInput(username || '')
        email = valid.sanitiseInput(email || '')
        timezone = valid.sanitiseInput(timezone || '')

        // Perform validation checks on the data
        if (!firstName) errors.push({ field: 'firstName', message: 'First name is required' })
        if (!lastName) errors.push({ field: 'lastName', message: 'Last name is required' })

        if (!username || !valid.isValidUsername(username)) errors.push({ field: 'username', message: 'Username is required and must be between 3 and 20 characters, containing only letters, numbers, underscores or hyphens' })
        if (!email || !valid.isValidEmail(email)) errors.push({ field: 'email', message: 'A valid email address is required' })

        if (!DOB) {
            errors.push({ field: 'DOB', message: 'Date of Birth is required' })
        } else {
            const dobDate = new Date(DOB)
            const today = new Date();

            if (dobDate >= today) {
                errors.push({ field: 'DOB', message: 'Date of Birth must be in the past' })
            }
        }

        if(!password || !valid.isValidPassword(password)) errors.push({ field: 'password', message: 'Password is required and must be at least 8 characters long, containing at least one uppercase letter, one lowercase letter, and one number' })
        
        if(password !== confirmPassword) errors.push({ field: 'confirmPassword', message: 'Passwords do not match' })

        if (!termsAccepted) errors.push({ field: 'terms', message: 'You must accept the terms and conditions to register' })

        if (errors.length > 0) {

            // If there are validation errors, re-render the registration page with error messages and previously entered form data (except passwords for security reasons)
            res.render('default', {
                isAuthenticated: req.isAuthenticated(),
                pagePath: 'core/register',
                pageTitle: 'Register - MCMS',
                errors: errors,
                formData: {
                    firstName,
                    lastName,
                    username,
                    DOB,
                    email,
                    marketing,
                    timezone
                }
            })
        } else {
            // Check if the username is already taken
            con.query('SELECT userID FROM users WHERE username = ?', [username], (err, results) => {
                if (err) {
                    console.error(err)
                    res.redirect('/login/register')
                } else {
                    if(results.length > 0) {
                        res.render('default', {
                            isAuthenticated: req.isAuthenticated(),
                            pagePath: 'core/register',
                            pageTitle: 'Register - MCMS',
                            errors: [{ field: 'username', message: 'Username is already taken' }],
                            formData: {
                                firstName,
                                lastName,
                                username,
                                DOB,
                                email,
                                marketing,
                                timezone
                            }
                        })
                    } else {
                        const newUser = [
                            uuidv4(),
                            firstName,
                            lastName,
                            username,
                            DOB,
                            email,
                            func.hashPassword(password),
                            Math.trunc(DateTime.utc().toSeconds()),
                            timezone
                        ]

                        con.query('INSERT INTO users (userID, firstName, lastName, username, DOB, email, password, accountCreated, timezone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', newUser , (err, results) => {
                            if (err) {
                                console.error(err)
                                res.redirect('/login/register')
                            } else {
                                res.redirect('/login')
                            }
                        })
                    }
                }
            })
        }
    } else {
        res.redirect('/')
    }
})


// Logout Route
// Ends the session on the server side and will instruct the client to destroy the cookie so that there isn't any errors due to a remaining cookie.
router.get('/logout', (req, res) => {
    if(req.user) {
        req.logout(() => {
            req.session.destroy(function (err) {

                if (!err) {
                    res.clearCookie(process.env.cookie_name, {path: '/', httpOnly: true, secure: process.env.secure_cookie == "true", domain: process.env.CURRENT_DOMAIN, sameSite: "strict"})
                    res.redirect('/')
                } else {
                    console.log(err)
                    res.redirect('/')
                }
            })
        })
    } else {
        res.redirect('/')
    }
})

// router.post('/login/authenticate')

module.exports = router
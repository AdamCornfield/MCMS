const express = require('express')
const passport = require('passport')
const router = express.Router()


router.route('/')
.get((req, res) => {
    res.render('default', {
        isAuthenticated: req.isAuthenticated(),
        pagePath: 'login',
        pageTitle: 'Login - MCMS'
    })
})
.post(passport.authenticate('local', { failureRedirect: '/register', successRedirect: '/' }))

router.route('/register')
.get((req, res) => {
    res.render('default', {
        isAuthenticated: req.isAuthenticated(),
        pagePath: 'register',
        pageTitle: 'Register - MCMS'
    })
})
.post((req, res) => {
    
})

router.get('/logout', (req, res) => {
    console.log(req.user)
    if(req.user) {
        req.logout(() => {
            const sessionId = req.session.id
        
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
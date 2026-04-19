const express = require('express')
const router = express.Router()
const auth = require('../coreModules/auth')
const con = require('../coreModules/dbConnection')
const func = require('../coreModules/coreFunctions')
const valid = require('../coreModules/validation')


/**
 * Takes an object of user permissions, and will build an array based on what permissions they have already or not for the toggles on the profile page
 * @param {Object} userPerms 
 * @returns 
 */
function buildPermissionToggles(userPerms) {
    return global.permData.map(perm => ({
        ...perm,
        checked: userPerms[perm.permissionName] === true
    }))
}

/**
 * Takes in a user object and another optional object, should that optional object exist and have relevant values then it will choose those values over the ones initially provided.
 * By doing this, even if there is an error or change in the data submitted from the HTML form and there are values missing, it will still be able to populate the form.
 * @param {*} user 
 * @param {*} overrides 
 * @returns 
 */
function buildProfileFormData(user, overrides = {}) {
    return {
        username: overrides.username ?? user.username ?? '',
        email: overrides.email ?? user.email ?? '',
        DOB: overrides.DOB ?? (user.DOB ? String(user.DOB).split('T')[0] : ''),
        firstName: overrides.firstName ?? user.firstName ?? '',
        lastName: overrides.lastName ?? user.lastName ?? '',
        timezone: overrides.timezone ?? user.timezone ?? ''
    }
}

// Admin Dashboard
router.get('/', (req, res) => {
    func.getUserData(req.user, (success, userData) => {
        if (!success) {
            console.error('Error fetching user data:', userData)
        } else {
            res.render('default', {
                isAuthenticated: req.isAuthenticated(),
                userData,
                pagePath: 'core/admin/index',
                pageTitle: 'Admin Dashboard - MCMS'
            })
        }
    })
})

router.route('/manageUsers')
.get(auth.hasPermissions(["MANAGE_USERS", "EDIT_PERMS"], "OR"), (req, res) => {
    con.query('SELECT * FROM users;', (err, users) => {
        if (err) {
            console.error(err)
            res.redirect('/admin')
            return
        }

        const filteredUsers = func.filterColumns(users, ['password']).map(user => {
            const decodedPerms = func.decodePermissionBitmask(user.perms || 0)
            const permsDecoded = Object.entries(decodedPerms)
                .filter(([, enabled]) => enabled === true)
                .map(([permissionName]) => permissionName)
                .join(', ')

            return {
                ...user,
                permsDecoded: permsDecoded || 'No permissions'
            }
        })

        func.getUserData(req.user, (success, userData) => {
            if (!success) {
                console.error('Error fetching user data:', userData)
                res.redirect('/admin')
                return
            }

            res.render('default', {
                isAuthenticated: req.isAuthenticated(),
                userData,
                pagePath: 'core/admin/users',
                pageTitle: 'Users - MCMS',
                columnNames: filteredUsers.length ? Object.keys(filteredUsers[0]) : [],
                users: filteredUsers,
                canEditUsers: userData?.perms?.ADMINISTRATOR === true || userData?.perms?.EDIT_PERMS === true,
                canChangePasswords: userData?.perms?.ADMINISTRATOR === true,
                statusMessage: req.query.updated === '1' ? 'User details were saved successfully.' : null
            })
        })
    })
})

router.route('/manageUsers/:userID')
.get(auth.hasPermissions(["EDIT_PERMS", "MANAGE_USERS"], "OR"), (req, res) => {
    func.getUserData(req.user, (success, userData) => {
        if (!success) {
            console.error('Error fetching user data:', userData)
            res.redirect('/admin/manageUsers')
        } else {
            // Get user data targeted on this profile
            func.getUserData(req.params.userID, (success, targetUserData) => {
                if (!success) {
                    console.error('Error fetching profile user data:', profileUserData)
                    res.redirect('/admin/manageUsers')
                } else {
                    console.log(buildPermissionToggles(targetUserData.perms))
                    res.render('default', {
                        isAuthenticated: req.isAuthenticated(),
                        userData,
                        pagePath: 'core/admin/profile',
                        pageTitle: `Edit ${targetUserData.username} - MCMS`,
                        user: targetUserData,
                        formData: targetUserData,
                        permissionToggles: buildPermissionToggles(targetUserData.perms),
                        profileErrors: [],
                        permissionErrors: [],
                        canChangePasswords: userData?.perms?.ADMINISTRATOR === true,
                        profileSuccess: req.query.profileUpdated === '1' ? 'Profile details saved successfully.' : null,
                        permissionSuccess: req.query.permissionsUpdated === '1' ? 'Permissions saved successfully.' : null
                    })
                }
            })
        }
    })
})
.post(auth.hasPermissions(["MANAGE_USERS"], "OR"), (req, res) => {
    func.getUserData(req.user, (success, userData) => {
        if (!success) {
            console.error('Error fetching user data:', userData)
            res.redirect('/admin/manageUsers')
            return
        } else {
            const userID = req.params.userID

            con.query('SELECT * FROM users WHERE userID = ?', [userID], (err, results) => {
                if (err) {
                    console.error(err)
                    res.redirect('/admin/manageUsers')
                } else {
                    if (!results.length) {
                        res.redirect('/admin/manageUsers')
                    } else {
                        const user = results[0]

                        const formData = {
                            firstName: valid.sanitiseInput(req.body.firstName),
                            lastName: valid.sanitiseInput(req.body.lastName),
                            username: valid.sanitiseInput(req.body.username),
                            email: valid.sanitiseInput(req.body.email),
                            DOB: req.body.DOB,
                            timezone: req.body.timezone
                        }

                        
                        const errors = []

                        if (!formData.firstName) errors.push({ field: 'firstName', message: 'First name is required' })
                        if (!formData.lastName) errors.push({ field: 'lastName', message: 'Last name is required' })
                        if (!formData.username || !valid.isValidUsername(formData.username)) errors.push({ field: 'username', message: 'Username is required and must be between 3 and 20 characters, containing only letters, numbers or underscores' })
                        if (!formData.email || !valid.isValidEmail(formData.email)) errors.push({ field: 'email', message: 'A valid email address is required' })
                        if (!formData.timezone) errors.push({ field: 'timezone', message: 'Timezone is required' })

                        if (!formData.DOB) {
                            errors.push({ field: 'DOB', message: 'Date of birth is required' })
                        } else {
                            const dobDate = new Date(formData.DOB)
                            const today = new Date()

                            if (Number.isNaN(dobDate.getTime())) {
                                errors.push({ field: 'DOB', message: 'Date of birth must be a valid date' })
                            } else if (dobDate >= today) {
                                errors.push({ field: 'DOB', message: 'Date of birth must be in the past' })
                            }
                        }

                        if (errors.length > 0) {
                            res.render('default', {
                                isAuthenticated: req.isAuthenticated(),
                                userData,
                                pagePath: 'core/admin/profile',
                                pageTitle: `Edit ${user.username} - MCMS`,
                                user: {
                                    ...user,
                                    permsDecoded: func.decodePermissionBitmask(user.perms || 0)
                                },
                                formData: buildProfileFormData(user, formData),
                                permissionToggles: buildPermissionToggles(user.perms),
                                profileErrors: errors,
                                permissionErrors: [],
                                profileSuccess: null,
                                permissionSuccess: null
                            })
                        } else {
                            if (existingUsers.length > 0) {
                                func.getUserData(req.user, (success, userData) => {
                                    if (!success) {
                                        console.error('Error fetching user data:', userData)
                                        res.redirect('/admin/manageUsers')
                                        return
                                    }

                                    res.render('default', {
                                        isAuthenticated: req.isAuthenticated(),
                                        userData,
                                        pagePath: 'core/admin/profile',
                                        pageTitle: `Edit ${user.username} - MCMS`,
                                        user: {
                                            ...user,
                                            permsDecoded: func.decodePermissionBitmask(user.perms || 0)
                                        },
                                        formData: buildProfileFormData(user, formData),
                                        permissionToggles: buildPermissionToggles(user.perms),
                                        profileErrors: [{ field: 'username', message: 'Username is already taken' }],
                                        permissionErrors: [],
                                        profileSuccess: null,
                                        permissionSuccess: null
                                    })
                                })
                            } else {
                                const updatedUser = [
                                    formData.username,
                                    formData.email,
                                    formData.DOB,
                                    formData.firstName,
                                    formData.lastName,
                                    formData.timezone,
                                    userID
                                ]

                                con.query('UPDATE users SET username = ?, email = ?, DOB = ?, firstName = ?, lastName = ?, timezone = ? WHERE userID = ?', updatedUser, (err) => {
                                    if (err) {
                                        console.error(err)
                                        func.getUserData(req.user, (success, userData) => {
                                            if (!success) {
                                                console.error('Error fetching user data:', userData)
                                                res.redirect('/admin/manageUsers')
                                                return
                                            }

                                            res.render('default', {
                                                isAuthenticated: req.isAuthenticated(),
                                                userData,
                                                pagePath: 'core/admin/profile',
                                                pageTitle: `Edit ${user.username} - MCMS`,
                                                user: {
                                                    ...user,
                                                    permsDecoded: func.decodePermissionBitmask(user.perms || 0)
                                                },
                                                formData: buildProfileFormData(user, formData),
                                                permissionToggles: buildPermissionToggles(user.perms),
                                                profileErrors: [{ field: 'form', message: 'Unable to save profile details right now. Please try again.' }],
                                                permissionErrors: [],
                                                profileSuccess: null,
                                                permissionSuccess: null
                                            })
                                        })
                                    } else {
                                        res.redirect(`/admin/manageUsers/${userID}?profileUpdated=1`)
                                    }
                                })
                            }
                        }
                    }
                }
            })
        }
    })
})

router.route('/manageUsers/:userID/changePassword')
.get(auth.hasPermissions(["ADMINISTRATOR"]), (req, res) => {
    func.getUserData(req.user, (success, userData) => {
        if (!success) {
            console.error('Error fetching user data:', userData)
            res.redirect('/admin/manageUsers')
        } else {
            func.getUserData(req.params.userID, (success, targetUserData) => {
                if (!success) {
                    console.error('Error fetching profile user data:', profileUserData)
                    res.redirect('/admin/manageUsers')
                } else {
                    res.render('default', {
                        isAuthenticated: req.isAuthenticated(),
                        userData,
                        pagePath: 'core/admin/changePassword',
                        pageTitle: `Change Password For ${targetUserData.username} - MCMS`,
                        user: targetUserData,
                        passwordSuccess: req.query.passwordUpdated === '1' ? 'Password changed successfully.' : null,
                        passwordError: null
                    })
                }
            })
        }
    })
})
.post(auth.hasPermissions(["ADMINISTRATOR"]), (req, res) => {
    func.getUserData(req.user, (success, userData) => {
        if (!success) {
            console.error('Error fetching user data:', userData)
            res.redirect('/admin/manageUsers')
        } else {
            const userID = req.params.userID
            const password = req.body.password

            con.query('SELECT * FROM users WHERE userID = ?', [userID], (err, results) => {
                if (err) {
                    console.error(err)
                    res.redirect('/admin/manageUsers')
                } else {
                    if (!results.length) {
                        res.redirect('/admin/manageUsers')
                    } else {
                        const user = results[0]
                        const hashedPassword = func.hashPassword(password)

                        con.query('UPDATE users SET password = ? WHERE userID = ?', [hashedPassword, userID], (err) => {
                            if (err) {
                                console.error(err)
                                res.render('default', {
                                    isAuthenticated: req.isAuthenticated(),
                                    userData,
                                    pagePath: 'core/admin/changePassword',
                                    pageTitle: `Change Password For ${user.username} - MCMS`,
                                    user,
                                    passwordSuccess: null,
                                    passwordError: 'Unable to change password right now. Please try again.'
                                })
                            } else {
                                res.redirect(`/admin/manageUsers/${userID}/changePassword?passwordUpdated=1`)
                            }
                        })
                    }
                }
            })
        }
    })
})

router.post('/manageUsers/:userID/permissions', auth.hasPermissions(["EDIT_PERMS"]), (req, res) => {
    const userID = req.params.userID

    con.query('SELECT * FROM users WHERE userID = ?', [userID], (err, results) => {
        if (err) {
            console.error(err)
            res.redirect('/admin/manageUsers')
            return
        }

        if (!results.length) {
            res.redirect('/admin/manageUsers')
            return
        }

        const user = results[0]

        const selectedPermissions = global.permData
            .filter(perm => req.body[`perm_${perm.bitPos}`] === '1')
            .map(perm => perm.permissionName)

        const permissionBitmask = func.encodePermissionBitmask(selectedPermissions)

        con.query('UPDATE users SET perms = ? WHERE userID = ?', [permissionBitmask, userID], (err) => {
            if (err) {
                console.error(err)
                func.getUserData(req.user, (success, userData) => {
                    if (!success) {
                        console.error('Error fetching user data:', userData)
                        res.redirect('/admin/manageUsers')
                        return
                    }

                    res.render('default', {
                        isAuthenticated: req.isAuthenticated(),
                        userData,
                        pagePath: 'core/admin/profile',
                        pageTitle: `Edit ${user.username} - MCMS`,
                        user: {
                            ...user,
                            permsDecoded: func.decodePermissionBitmask(user.perms || 0)
                        },
                        formData: buildProfileFormData(user),
                        permissionToggles: global.permData.map(perm => ({
                            ...perm,
                            checked: selectedPermissions.includes(perm.permissionName)
                        })),
                        profileErrors: [],
                        permissionErrors: [{ field: 'form', message: 'Unable to save permissions right now. Please try again.' }],
                        profileSuccess: null,
                        permissionSuccess: null
                    })
                })
                return
            }

            res.redirect(`/admin/manageUsers/${userID}?permissionsUpdated=1`)
        })
    })
})

module.exports = router

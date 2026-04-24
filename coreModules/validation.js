const { DateTime } = require('luxon')

/**
 * Remove any potentially harmful characters from the input
 * @param {string} input 
 * @returns {string}
 */
function sanitiseInput(input) {
    return input.replace(/[<>"'\/]/g, '')
}

/**
 * Simple regex to check if the email is in a valid format
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Check if the username is between 3 and 20 characters and contains only alphanumeric characters and underscores
 * @param {string} username 
 * @returns {boolean}
 */
function isValidUsername(username) {
    const usernameRegex = /^\w{3,20}$/
    return usernameRegex.test(username)
}

/**
 * Check if the password is at least 8 characters long and contains at least one uppercase letter, one lowercase letter, and one number
 * @param {string} password 
 * @returns {boolean}
 */
function isValidPassword(password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/
    return passwordRegex.test(password)
}

/**
 * Returns true or false boolean values depending on if it is valid or not
 * @param {string} input 
 * @returns {boolean}
 */
function isValidDateTime(input) {
    return DateTime.fromISO(input).isValid
}

/**
 * Checks if the provided date time string is in the future compared to today or not.
 * @param {string} input 
 * @returns {boolean}
 */
function isFutureDateTime(input) {
    return DateTime.fromISO(input) > DateTime.now()
}

module.exports = {
    sanitiseInput,
    isValidEmail,
    isValidUsername,
    isValidPassword
}
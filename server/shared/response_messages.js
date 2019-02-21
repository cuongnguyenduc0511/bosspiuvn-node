const authMessages = {
    USER_NOT_EXISTS: 'User Does Not Exists',
    INVALID_PASSWORD: 'Invalid Password',
    AUTH_SUCCESS: 'Authenticate Successfully',
    UNAUTHORIZED: 'Unauthorized Request',
    TOKEN_EXPIRED: 'Token Expired',
    AUTH_ERROR: 'An error occurred while authenticating, please try again later',
    SIGN_OUT_SUCCESS: 'Sign Out Success',
    SIGN_OUT_FAILED: 'An error occurred while signing out, please try again later'
}

const requestMessages = {
    REGISTER_ERROR: 'An error occurred while registering, please try again later',
}

module.exports = {
    authMessages,
    requestMessages
}
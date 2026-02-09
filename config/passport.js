const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const getAppBaseUrl = () => process.env.APP_URL || `http://localhost:${process.env.PORT || 3003}`;

const canUseGoogleAuth = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
);

if (canUseGoogleAuth) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || `${getAppBaseUrl()}/api/auth/google/callback`
            },
            (accessToken, refreshToken, profile, done) => done(null, profile)
        )
    );
} else {
    console.warn('[auth] Google OAuth is disabled: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are missing.');
}

module.exports = {
    passport,
    canUseGoogleAuth
};

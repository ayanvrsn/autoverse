const secret = process.env.JWT_SECRET;

if (!secret) {
    throw new Error('JWT_SECRET is not set');
}

module.exports = {
    secret
};

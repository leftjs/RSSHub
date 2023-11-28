module.exports = function (router) {
    router.get('/rank/:category?/:time?', require('./rank.js'));
};

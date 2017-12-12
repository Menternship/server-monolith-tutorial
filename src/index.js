// @flow
import getRegister from 'menternship-utils-hapi/server';
import posts from './controllers/posts'

console.log('5 is alive')
const register = getRegister([...posts])

module.exports = register;
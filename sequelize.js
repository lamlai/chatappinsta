const Sequelize = require('sequelize')
const CustomerModel = require('./src/models/customer')
const WebsiteModel = require('./src/models/website')
const ConfigModel = require('./src/models/config')
require('dotenv').config();
let dbHost = (process.env.PGHOST) ? process.env.PGHOST : 'localhost';
let dbName = (process.env.PGDATABASE) ? process.env.PGDATABASE : 'database';
let dbUser = (process.env.PGUSER) ? process.env.PGUSER : 'foo';
let dbPass = (process.env.PGPASSWORD) ? process.env.PGPASSWORD : 'bar';

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    dialect: 'postgres',
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    logging: false
})


const Customer = CustomerModel(sequelize, Sequelize)
const Website = WebsiteModel(sequelize, Sequelize)
const Config = ConfigModel(sequelize, Sequelize)

sequelize.sync({ force: false })
    .then(() => {
        console.log('Database & tables created!')
    })

module.exports = { Customer, Website, Config }
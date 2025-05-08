const config = require('../config.json');
const { Pool } = require('pg');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    try {
        const { host, port, user, password, database } = config.database;
        
        // 1. Connect to PostgreSQL with Pool
        const pool = new Pool({
            host,
            port,
            user,
            password,
            database
        });
        
        // Test connection
        await pool.query('SELECT NOW()');
        
        // 2. Connect Sequelize
        const sequelize = new Sequelize(database, user, password, { 
            host,
            port,
            dialect: 'postgres',
            dialectOptions: {
                connectTimeout: 10000
            },
            logging: console.log // Enable to see SQL queries
        });

        // 3. Initialize models
        db.Account = require('../accounts/account.model')(sequelize);
        db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);

        // 4. Setup relationships
        db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
        db.RefreshToken.belongsTo(db.Account);

        // 5. Sync models
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        console.log('Database synchronized');
        
    } catch (err) {
        console.error('Database initialization failed:', err);
        process.exit(1);
    }
}
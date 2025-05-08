const config = require('../config.json');
const { Pool } = require('pg');
const { Sequelize } = require('sequelize');

module.exports = db = {};

initialize();

async function initialize() {
    const maxRetries = 5;
    let retryCount = 0;
    let connected = false;

    while (!connected && retryCount < maxRetries) {
        try {
            console.log(`Connection attempt ${retryCount + 1} of ${maxRetries}...`);
            const { host, port, user, password, database } = config.database;
            
            // 1. Connect to PostgreSQL with Pool
            const pool = new Pool({
                host,
                port,
                user,
                password,
                database,
                ssl: {
                    rejectUnauthorized: false
                },
                connectionTimeoutMillis: 20000,
                idleTimeoutMillis: 30000,
                max: 20
            });
            
            // Test connection
            await pool.query('SELECT NOW()');
            console.log('PostgreSQL Pool connection successful');
            
            // 2. Connect Sequelize
            const sequelize = new Sequelize(database, user, password, { 
                host,
                port,
                dialect: 'postgres',
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false
                    },
                    connectTimeout: 20000
                },
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
                logging: false,
                retry: {
                    max: 3
                }
            });

            // 3. Initialize models
            db.Account = require('../accounts/account.model')(sequelize);
            db.RefreshToken = require('../accounts/refresh-token.model')(sequelize);

            // 4. Setup relationships
            db.Account.hasMany(db.RefreshToken, { onDelete: 'CASCADE' });
            db.RefreshToken.belongsTo(db.Account);

            // 5. Sync models
            await sequelize.authenticate();
            console.log('Sequelize authentication successful');
            await sequelize.sync({ alter: true });
            console.log('Database synchronized');
            
            connected = true;
        } catch (err) {
            retryCount++;
            console.error(`Database connection attempt ${retryCount} failed:`, err.message);
            
            if (retryCount >= maxRetries) {
                console.error('Maximum retry attempts reached. Database initialization failed.');
                console.error(err);
                process.exit(1);
            }
            
            // Wait before trying again (exponential backoff)
            const waitTime = Math.min(2000 * Math.pow(2, retryCount), 30000);
            console.log(`Retrying in ${waitTime/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}
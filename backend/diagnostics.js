require('rootpath')();
const config = require('./config.json');
const { Pool } = require('pg');

async function runDiagnostics() {
    console.log('Running database connection diagnostics...');
    console.log('\nEnvironment Information:');
    console.log('- Node.js version:', process.version);
    console.log('- Operating System:', process.platform, process.arch);
    
    console.log('\nConnection Parameters:');
    const { host, port, user, database } = config.database;
    console.log('- Host:', host);
    console.log('- Port:', port);
    console.log('- User:', user);
    console.log('- Database:', database);
    console.log('- URL Format:', `postgresql://${user}:***@${host}:${port}/${database}`);
    
    // Test direct connection
    try {
        console.log('\nTesting direct connection...');
        const connectionString = `postgresql://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.database}`;
        
        const pool = new Pool({
            connectionString,
            ssl: {
                rejectUnauthorized: false
            },
            connectionTimeoutMillis: 10000
        });
        
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Connection successful!');
        console.log('Server time:', result.rows[0].now);
        
        // Try to count users
        try {
            const usersResult = await pool.query('SELECT COUNT(*) FROM accounts');
            console.log('✅ User accounts table exists with', usersResult.rows[0].count, 'accounts');
        } catch (err) {
            console.log('❌ Could not query accounts table:', err.message);
        }
        
        await pool.end();
    } catch (err) {
        console.log('❌ Connection failed:', err.message);
        console.log('\nTroubleshooting tips:');
        console.log('1. Check if the database server is running');
        console.log('2. Verify that the connection parameters are correct');
        console.log('3. Ensure that your IP is allowed to connect to the database');
        console.log('4. Make sure SSL settings are correctly configured');
    }
}

runDiagnostics().catch(err => {
    console.error('Diagnostics failed:', err);
}); 
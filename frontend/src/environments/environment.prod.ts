// Dynamic environment configuration based on hostname
const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
const isVercel = hostname.includes('vercel.app');

export const environment = {
    production: true,
    apiUrl: 'https://user-management-angular-lopez.onrender.com/accounts',
    cookieDomain: isLocalhost 
        ? undefined 
        : isVercel 
            ? '.vercel.app'
            : '.onrender.com'
};

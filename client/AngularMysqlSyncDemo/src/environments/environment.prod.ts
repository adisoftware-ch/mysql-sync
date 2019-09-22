export const environment = {
  production: true,
  dataProvider: {
    requireAuthToken  : true,
    secure            : true,
    socketurl         : 'https://localhost:3000',
    secureconfig      : {
      ca: '../assets/cert.pem',
      secure: true,
      rejectUnauthorized: false,
      agent: false
    }
  },
  firebase: {
    apiKey: '...',
    authDomain: '...',
    databaseURL: '...',
    projectId: '...',
    storageBucket: '',
    messagingSenderId: '...',
    appId: '...'
  }
};

import { type Configuration, LogLevel } from '@azure/msal-browser';

// IMPORTANTE: Reemplaza estos valores con los de tu Azure AD App Registration
// Guia: https://portal.azure.com > Azure Active Directory > App registrations > New registration
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'TU_CLIENT_ID_AQUI',
    authority: import.meta.env.VITE_MICROSOFT_AUTHORITY || 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
    },
  },
};

export const loginRequest = {
  scopes: ['User.Read'],
};

import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';

// API URL configuration based on environment
const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://moonshoot.fun:2053'
  : 'http://localhost:2053';

console.log('Environment:', process.env.NODE_ENV);
console.log('API URL:', apiUrl);

// HTTP link with credentials
const httpLink = createHttpLink({
  uri: `${apiUrl}/graphql`,
  credentials: 'include',
  fetchOptions: {
    credentials: 'include',
  }
});

// Error handling link with detailed logging
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      
      // Handle authentication errors
      if (message === 'Not authenticated') {
        Cookies.remove(TOKEN_KEY, { path: '/' });
        window.location.href = '/auth/login';
      }
    });
  }
  if (networkError) {
    console.error(`[Network error]:`, networkError);
    if ('statusCode' in networkError) {
      console.error(`Status code: ${networkError.statusCode}`);
    }
    if ('response' in networkError) {
      console.error('Response:', networkError.response);
    }
  }
});

// Auth link with credentials
const authLink = setContext((_, { headers }) => {
  const token = Cookies.get(TOKEN_KEY);
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Credentials': 'true'
    }
  };
});

// Create Apollo Client instance
const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
    mutate: {
      fetchPolicy: 'no-cache',
    }
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
  credentials: 'include'
});

export default client;
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';

// API URL configuration based on environment
const apiUrl = process.env.NODE_ENV === 'production'
  ? 'https://moonshoot.fun:2053'
  : 'http://localhost:2053';

console.log('Environment:', process.env.NODE_ENV);
console.log('API URL:', apiUrl);

// HTTP link with credentials
const httpLink = createHttpLink({
  uri: `${apiUrl}/graphql`,
  credentials: 'include',
  fetchOptions: {
    credentials: 'include',
  }
});

// Error handling link with detailed logging
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
      
      // Handle authentication errors
      if (message === 'Not authenticated') {
        Cookies.remove(TOKEN_KEY, { path: '/' });
        window.location.href = '/auth/login';
      }
    });
  }
  if (networkError) {
    console.error(`[Network error]:`, networkError);
    if ('statusCode' in networkError) {
      console.error(`Status code: ${networkError.statusCode}`);
    }
    if ('response' in networkError) {
      console.error('Response:', networkError.response);
    }
  }
});

// Auth link with credentials
const authLink = setContext((_, { headers }) => {
  const token = Cookies.get(TOKEN_KEY);
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Credentials': 'true'
    }
  };
});

// Create Apollo Client instance
const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'network-only',
    },
    query: {
      fetchPolicy: 'network-only',
    },
    mutate: {
      fetchPolicy: 'no-cache',
    }
  },
  connectToDevTools: process.env.NODE_ENV === 'development',
  credentials: 'include'
});

export default client; 
import 'express';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

declare module 'express' {
  interface Request {
    session: import('express-session').Session & {
      userId?: number;
    };
  }
}
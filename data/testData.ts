const timestamp = Date.now();

export const adminCredentials = {
  email: 'admin@dmoney.com',
  password: '1234',
};

export const systemCredentials = {
  email: 'system@dmoney.com',
  password: '1234',
};

export const agentData = {
  fullName: `Playwright Agent ${timestamp}`,
  email: `mahmudjohn1+playwright${timestamp}@gmail.com`,
  password: 'Agent@1234',

  // Unique 11-digit phone number
  phone: `017${String(timestamp).slice(-8)}`,

  // Unique NID
  nid: String(timestamp).slice(-10),

};

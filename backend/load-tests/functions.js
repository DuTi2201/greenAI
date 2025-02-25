const crypto = require('crypto');

// Store tokens and garden IDs for reuse
const tokens = [];
const gardenIds = [];

// Helper functions
function $randomEmail() {
  const random = crypto.randomBytes(8).toString('hex');
  return `test-${random}@example.com`;
}

function $randomString() {
  return crypto.randomBytes(8).toString('hex');
}

function $randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function $timestamp(offsetSeconds = 0) {
  return new Date(Date.now() + offsetSeconds * 1000).toISOString();
}

// Artillery processor functions
function setAuthToken(context, events, done) {
  if (tokens.length > 0) {
    // Reuse existing token
    context.vars.authToken = tokens[Math.floor(Math.random() * tokens.length)];
    return done();
  }

  // Create new user and get token
  const random = crypto.randomBytes(8).toString('hex');
  const payload = {
    email: `test-${random}@example.com`,
    password: 'Test@123',
    fullName: 'Test User',
  };

  const requestParams = {
    url: '/auth/register',
    json: payload,
  };

  events.emit('request', requestParams);
  events.emit('response', requestParams, (err, response) => {
    if (err) return done(err);
    if (response.statusCode !== 201) return done(new Error('Registration failed'));

    const token = response.body.token;
    tokens.push(token);
    context.vars.authToken = token;
    done();
  });
}

function getRandomGardenId(context, events, done) {
  if (gardenIds.length > 0) {
    // Reuse existing garden ID
    context.vars.gardenId = gardenIds[Math.floor(Math.random() * gardenIds.length)];
    return done();
  }

  // Create new garden
  const payload = {
    name: 'Test Garden',
    wemosSerial: $randomString(),
    location: 'Test Location',
  };

  const requestParams = {
    url: '/gardens',
    json: payload,
    headers: {
      Authorization: `Bearer ${context.vars.authToken}`,
    },
  };

  events.emit('request', requestParams);
  events.emit('response', requestParams, (err, response) => {
    if (err) return done(err);
    if (response.statusCode !== 201) return done(new Error('Garden creation failed'));

    const gardenId = response.body.id;
    gardenIds.push(gardenId);
    context.vars.gardenId = gardenId;
    done();
  });
}

module.exports = {
  $randomEmail,
  $randomString,
  $randomInt,
  $timestamp,
  setAuthToken,
  getRandomGardenId,
}; 
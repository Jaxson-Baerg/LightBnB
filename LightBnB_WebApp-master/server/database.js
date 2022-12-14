const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users WHERE email=$1;`, [email])
    .then(result => {return Promise.resolve(result.rows[0])})
    .catch(err => {console.log(err.message)});
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE id=$1;`, [id])
    .then(result => {return Promise.resolve(result.rows)})
    .catch(err => {console.log(err.message)});
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
    .query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`, [user.name, user.email, user.password])
    .then(result => {return Promise.resolve(result.rows)})
    .catch(err => {console.log(err.message)});
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(`
      SELECT thumbnail_photo_url, properties.title, number_of_bedrooms, number_of_bathrooms, parking_spaces, properties.cost_per_night, reservations.start_date, reservations.end_date, AVG(rating) AS average_rating
        FROM reservations
          JOIN properties ON reservations.property_id=properties.id
          JOIN property_reviews ON reservations.property_id=property_reviews.property_id
        WHERE reservations.guest_id=$1
        GROUP BY properties.id, reservations.id
        ORDER BY reservations.start_date
        LIMIT $2;`,
      [guest_id, limit])
    .then(result => {return Promise.resolve(result.rows)})
    .catch(err => {console.log(err.message)});
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const queryValues = [options.city || '', options.owner_id || -1, options.minimum_price_per_night/100 || 0, options.maximum_price_per_night/100 || 999999999, options.minimum_rating || 0, limit];

  return pool
    .query(`
      SELECT properties.*, AVG(rating) AS average_rating
        FROM properties
          JOIN property_reviews ON properties.id=property_id
        WHERE city=(CASE WHEN $1='' THEN city ELSE $1 END)
          AND owner_id=(CASE WHEN $2=-1 THEN owner_id ELSE $2 END)
          AND cost_per_night>=$3
          AND cost_per_night<=$4
        GROUP BY properties.id
        HAVING AVG(rating)>=$5
        ORDER BY cost_per_night
        LIMIT $6;`, queryValues)
    .then(result => {return Promise.resolve(result.rows)})
    .catch(err => {console.log(err)});
}
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const queryValues = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms];

  return pool
    .query(`INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING*;`, queryValues)
    .then(result => {return Promise.resolve(result.rows)})
    .catch(err => {console.log(err)});
}
exports.addProperty = addProperty;

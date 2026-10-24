const { createCrudController } = require('../../utils/crudController');
const service = require('./boats.service');

module.exports = createCrudController(service, 'Kapal');

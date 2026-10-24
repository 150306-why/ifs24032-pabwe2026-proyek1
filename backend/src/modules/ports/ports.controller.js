const { createCrudController } = require('../../utils/crudController');
const service = require('./ports.service');

module.exports = createCrudController(service, 'Pelabuhan');

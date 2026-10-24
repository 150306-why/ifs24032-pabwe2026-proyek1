const { createCrudController } = require('../../utils/crudController');
const service = require('./routes.service');

module.exports = createCrudController(service, 'Rute');

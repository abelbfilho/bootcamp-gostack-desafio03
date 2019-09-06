import Sequelize from 'sequelize';

import User from '../app/models/user';
import File from '../app/models/file';
import Meetapp from '../app/models/meetapp';
import Subscriptions from '../app/models/subscription';

import databaseConfig from '../config/database';

const models = [User, File, Meetapp, Subscriptions];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(databaseConfig);

    models
      .map(model => model.init(this.connection))
      .map(model => model.associate && model.associate(this.connection.models));
  }
}

export default new Database();

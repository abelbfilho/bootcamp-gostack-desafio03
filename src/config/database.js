module.exports = {
  dialect: 'postgres',
  host: 'localhost',
  port: '5433',
  username: 'postgres',
  password: 'meetapp',
  database: 'meetapp',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};

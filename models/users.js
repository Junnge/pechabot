module.exports = (sequelize, DataTypes) => {
	return sequelize.define('users', {
		id: {
			type: DataTypes.STRING,
			primaryKey: true,
		},
		balance: {
			type: DataTypes.INTEGER,
			defaultValue: 1000,
			allownNull: false,
		},
		dailyStreak: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allownNull: false,
		},
		dailyStamp: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allownNull: false,
		},
	});
};
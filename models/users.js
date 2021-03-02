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
		trade: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
			allownNull: false,
		},
		guild: {
			type: DataTypes.STRING,
			defaultValue: false,
			allownNull: true,
		},
		username: {
			type: DataTypes.STRING,
			defaultValue: false,
			allownNull: true,
		},
		lucklvl: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
			allownNull: false,
		},
		dislvl: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
			allownNull: false,
		},
		dailylvl: {
			type: DataTypes.INTEGER,
			defaultValue: 1,
			allownNull: false,
		},
		score: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allownNull: false,
		},
		packsopened: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allownNull: false,
		},
		cardssold: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allownNull: false,
		},
		cardsbought: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allownNull: false,
		},
		cardsdisenchanted: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allownNull: false,
		},
		skillpoints: {
			type: DataTypes.INTEGER,
			defaultValue: 0,
			allownNull: false,
		}

	});
};
module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user_cards', {
		user_id: DataTypes.STRING,
		card_id: DataTypes.STRING,
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 0,
		},
	}, {
		timestamps: false,
	});
};
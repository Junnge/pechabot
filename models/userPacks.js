module.exports = (sequelize, DataTypes) => {
	return sequelize.define('user_packs', {
		user_id: DataTypes.STRING,
		pack_id: DataTypes.STRING,
		amount: {
			type: DataTypes.INTEGER,
			allowNull: false,
			'default': 0,
		},
	}, {
		timestamps: false,
	});
};
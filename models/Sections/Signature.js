import sequelize from '../../db/index.js';
import { DataTypes } from 'sequelize';

const Signature = sequelize.define('section_signature', {
  targets: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
  },
  signer: {
    type: DataTypes.TEXT,
    get() {
      try {
        return JSON.parse(this.getDataValue('signer'));
      } catch (e) {
        return null;
      }
    },
    set(value) {
      this.setDataValue('signer', JSON.stringify(value));
    },
  },
  signatures: {
    type: DataTypes.JSON,
  },
});

export default Signature;

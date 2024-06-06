import sequelize, { serialize, DataTypes } from './sequelize.js';

const Section = sequelize.define('section');
// Section.hasOne(Code);
// Section.hasOne(Cipher);
// Section.hasOne(Data);
// Section.hasOne(ExtraData);
// Section.hasOne(Header);
// Section.hasOne(MaspBuilder);
// Section.hasOne(Signature);

export default Section;

export const

  Cipher = sequelize.define('section_cipher', {
    cipherText: { type: DataTypes.TEXT },
  }),

  Code = sequelize.define('section_code', {
    salt: { type: DataTypes.TEXT },
    code: { type: DataTypes.TEXT },
    tag:  { type: DataTypes.TEXT },
  }),

  Data = sequelize.define('section_data', {
    salt: { type: DataTypes.TEXT, },
    data: { type: DataTypes.TEXT, },
  }),

  ExtraData = sequelize.define('section_extra_data', {
    salt: { type: DataTypes.TEXT, },
    code: { type: DataTypes.TEXT, },
    tag:  { type: DataTypes.TEXT, },
  }),

  Header = sequelize.define("section_header", {
    type:       { type: DataTypes.TEXT },
    chainId:    { type: DataTypes.TEXT },
    expiration: { type: DataTypes.TEXT },
    timestamp:  { type: DataTypes.TEXT },
    codeHash:   { type: DataTypes.TEXT },
    dataHash:   { type: DataTypes.TEXT },
    memoHash:   { type: DataTypes.TEXT },
    txType:     { type: DataTypes.TEXT },
  }),

  MaspBuilder = sequelize.define("section_masp_builder", {
    type:     { type: DataTypes.TEXT },
    target:   { type: DataTypes.TEXT },
    token:    { type: DataTypes.TEXT },
    denom:    { type: DataTypes.TEXT },
    position: { type: DataTypes.TEXT },
  }),

  MaspTx = sequelize.define("section_masp_tx", {
    type:              { type: DataTypes.TEXT },
    txid:              { type: DataTypes.TEXT },
    lockTime:          { type: DataTypes.TEXT },
    expiryHeight:      { type: DataTypes.TEXT },
    transparentBundle: { type: DataTypes.JSON },
    saplingBundle:     { type: DataTypes.JSON },
  }),

  Signature = sequelize.define('section_signature', {
    targets: { type: DataTypes.ARRAY(DataTypes.TEXT) },
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
        this.setDataValue('signer', serialize(value));
      },
    },
    signatures: { type: DataTypes.JSON },
  });

export const NAME_TO_SECTION = {
  Cipher,
  Code,
  Data,
  ExtraData,
  Header,
  MaspBuilder,
  MaspTx,
  Signature
};

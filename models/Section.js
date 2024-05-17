import sequelize from "../db/index.js";

const Section = sequelize.define('section');
// Section.hasOne(Code);
// Section.hasOne(Cipher);
// Section.hasOne(Data);
// Section.hasOne(ExtraData);
// Section.hasOne(Header);
// Section.hasOne(MaspBuilder);
// Section.hasOne(Signature);

export default Section;
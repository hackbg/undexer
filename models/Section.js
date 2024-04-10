import sequelize from "../db/index.js";
import Code from "./Sections/Code.js";
import Cipher from "./Sections/Cipher.js";
import Data from "./Sections/Data.js";
import ExtraData from "./Sections/ExtraData.js";
import Header from "./Sections/Header.js";
import MaspBuilder from "./Sections/MaspBuilder.js";
import Signature from "./Sections/Signature.js";

const Section = sequelize.define('section');
Section.hasOne(Code);
Section.hasOne(Cipher);
Section.hasOne(Data);
Section.hasOne(ExtraData);
Section.hasOne(Header);
Section.hasOne(MaspBuilder);
Section.hasOne(Signature);

export default Section;
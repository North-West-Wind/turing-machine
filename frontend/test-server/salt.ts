import bcrypt from "bcrypt";

const salt = bcrypt.genSaltSync();
console.log(bcrypt.hashSync(process.argv[2], salt));
console.log(salt);
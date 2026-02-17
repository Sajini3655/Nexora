// hash.mjs
import bcrypt from 'bcryptjs'

const password = "manager123";

const hash = await bcrypt.hash(password, 10);

console.log("Hashed Password:");
console.log(hash);

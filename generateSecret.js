// generateSecret.js
const crypto = require("crypto");

// Gerar uma chave secreta aleatória de 64 bytes e convertê-la para formato hexadecimal
const secret = crypto.randomBytes(64).toString("hex");

// Imprimir a chave secreta no console
console.log("Chave secreta gerada:", secret);

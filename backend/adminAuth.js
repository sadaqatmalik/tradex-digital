const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  if (typeof password !== "string" || !password.length) {
    throw new Error("A valid password is required.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);

  return `${salt}:${key.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  try {
    if (
      typeof password !== "string" ||
      typeof storedHash !== "string"
    ) {
      return false;
    }

    const parts = storedHash.split(":");

    if (parts.length !== 2) return false;

    const [salt, savedKey] = parts;

    if (
      !/^[a-f0-9]{32}$/i.test(salt) ||
      !/^[a-f0-9]{128}$/i.test(savedKey)
    ) {
      return false;
    }

    const key = await scrypt(password, salt, 64);
    const savedBuffer = Buffer.from(savedKey, "hex");

    return (
      savedBuffer.length === key.length &&
      crypto.timingSafeEqual(key, savedBuffer)
    );
  } catch {
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword
};
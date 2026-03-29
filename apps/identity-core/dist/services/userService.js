"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByEmail = getUserByEmail;
exports.getUserById = getUserById;
exports.createUser = createUser;
exports.updateUserPassword = updateUserPassword;
exports.setEmailVerified = setEmailVerified;
exports.deactivateUser = deactivateUser;
const postgres_1 = require("../db/postgres");
const password_1 = require("../crypto/password");
const authService_1 = require("./authService");
async function getUserByEmail(email) {
    const { rows } = await postgres_1.db.query('SELECT * FROM ic_users WHERE email = $1', [email.toLowerCase()]);
    return rows[0] || null;
}
async function getUserById(id) {
    const { rows } = await postgres_1.db.query('SELECT * FROM ic_users WHERE id = $1', [id]);
    return rows[0] || null;
}
async function createUser(data) {
    const passwordHash = data.password ? await (0, password_1.hashPassword)(data.password) : null;
    const { rows } = await postgres_1.db.query(`INSERT INTO ic_users (email, password_hash, full_name, org_id, roles)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`, [
        data.email.toLowerCase(),
        passwordHash,
        data.full_name || null,
        data.org_id || null,
        data.roles || [],
    ]);
    return rows[0];
}
async function updateUserPassword(userId, newPassword) {
    const hash = await (0, password_1.hashPassword)(newPassword);
    const { rows } = await postgres_1.db.query('SELECT state_version FROM ic_users WHERE id = $1', [userId]);
    if (!rows[0])
        throw new Error('USER_NOT_FOUND');
    // Optimistic lock on state_version — increment token_version to invalidate all JWTs
    await (0, authService_1.incrementTokenVersion)(userId, rows[0].state_version);
    await postgres_1.db.query('UPDATE ic_users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, userId]);
}
async function setEmailVerified(userId) {
    await postgres_1.db.query('UPDATE ic_users SET email_verified = true, updated_at = NOW() WHERE id = $1', [userId]);
}
// Soft delete only — NEVER hard delete
async function deactivateUser(userId) {
    await postgres_1.db.query('UPDATE ic_users SET is_active = false, updated_at = NOW() WHERE id = $1', [userId]);
}

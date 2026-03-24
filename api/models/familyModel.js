// Family Model - Database operations for families, family_members, and family_relationships

const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const familyModel = {
    // ==================== FAMILY OPERATIONS ====================

    // Create a new family and add creator as head
    async createFamily(data) {
        const pool = getPool();
        const { name, description, createdBy } = data;

        const familyId = uuidv4();

        // Insert family
        await pool.query(
            'INSERT INTO families (id, name, description, created_by) VALUES (?, ?, ?, ?)',
            [familyId, name, description || null, createdBy]
        );

        // Add creator as head member
        const memberId = uuidv4();
        await pool.query(
            'INSERT INTO family_members (id, family_id, user_id, role) VALUES (?, ?, ?, ?)',
            [memberId, familyId, createdBy, 'head']
        );

        // Get the created family with member details
        const [families] = await pool.query(
            `SELECT f.*, fm.role as creator_role, fm.id as membership_id,
             u.first_name, u.last_name, u.email
             FROM families f
             JOIN family_members fm ON f.id = fm.family_id
             JOIN users u ON fm.user_id = u.id
             WHERE f.id = ? AND fm.user_id = ?`,
            [familyId, createdBy]
        );

        return families[0];
    },

    // Get family by ID
    async getFamilyById(familyId) {
        const pool = getPool();
        const [families] = await pool.query(
            'SELECT * FROM families WHERE id = ?',
            [familyId]
        );
        return families[0] || null;
    },

    // Get family by ID with creator info
    async getFamilyByIdWithCreator(familyId) {
        const pool = getPool();
        const [families] = await pool.query(
            `SELECT f.*, u.first_name as creator_first_name, u.last_name as creator_last_name, u.email as creator_email
             FROM families f
             JOIN users u ON f.created_by = u.id
             WHERE f.id = ?`,
            [familyId]
        );
        return families[0] || null;
    },

    // Get all families a user belongs to
    async getUserFamilies(userId) {
        const pool = getPool();
        const [families] = await pool.query(
            `SELECT f.*, fm.role as member_role, fm.nickname, fm.joined_at as member_since,
             u.first_name as creator_first_name, u.last_name as creator_last_name,
             (SELECT COUNT(*) FROM family_members WHERE family_id = f.id) as member_count
             FROM families f
             JOIN family_members fm ON f.id = fm.family_id
             JOIN users u ON f.created_by = u.id
             WHERE fm.user_id = ?
             ORDER BY fm.joined_at DESC`,
            [userId]
        );
        return families;
    },

    // Update family
    async updateFamily(familyId, data) {
        const pool = getPool();
        const { name, description } = data;

        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }

        if (updates.length === 0) return true;

        params.push(familyId);
        await pool.query(
            `UPDATE families SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        return true;
    },

    // Delete family
    async deleteFamily(familyId) {
        const pool = getPool();
        await pool.query('DELETE FROM families WHERE id = ?', [familyId]);
        return true;
    },

    // ==================== FAMILY MEMBER OPERATIONS ====================

    // Get all members of a family
    async getFamilyMembers(familyId) {
        const pool = getPool();
        const [members] = await pool.query(
            `SELECT fm.*, u.first_name, u.last_name, u.email, u.phone, u.role as user_role
             FROM family_members fm
             JOIN users u ON fm.user_id = u.id
             WHERE fm.family_id = ?
             ORDER BY fm.role DESC, fm.joined_at ASC`,
            [familyId]
        );
        return members;
    },

    // Get family member by family and user ID
    async getFamilyMember(familyId, userId) {
        const pool = getPool();
        const [members] = await pool.query(
            `SELECT fm.*, u.first_name, u.last_name, u.email
             FROM family_members fm
             JOIN users u ON fm.user_id = u.id
             WHERE fm.family_id = ? AND fm.user_id = ?`,
            [familyId, userId]
        );
        return members[0] || null;
    },

    // Get member by family and user ID (alias for getFamilyMember)
    async getMemberByFamilyAndUser(familyId, userId) {
        return this.getFamilyMember(familyId, userId);
    },

    // Add member to family
    async addMember(familyId, userId, role = 'member', nickname = null) {
        const pool = getPool();

        const memberId = uuidv4();
        await pool.query(
            'INSERT INTO family_members (id, family_id, user_id, role, nickname) VALUES (?, ?, ?, ?, ?)',
            [memberId, familyId, userId, role, nickname || null]
        );

        // Get the added member details
        const [members] = await pool.query(
            `SELECT fm.*, u.first_name, u.last_name, u.email, u.phone, u.role as user_role
             FROM family_members fm
             JOIN users u ON fm.user_id = u.id
             WHERE fm.id = ?`,
            [memberId]
        );

        return members[0];
    },

    // Remove member from family
    async removeMember(familyId, userId) {
        const pool = getPool();

        // Check if user is head
        const member = await this.getFamilyMember(familyId, userId);
        if (member && member.role === 'head') {
            throw new Error('Cannot remove the family head');
        }

        await pool.query(
            'DELETE FROM family_members WHERE family_id = ? AND user_id = ?',
            [familyId, userId]
        );
        return true;
    },

    // Update member role (transfer head)
    async updateMemberRole(familyId, userId, newRole) {
        const pool = getPool();

        // Get current head
        const [currentHead] = await pool.query(
            'SELECT * FROM family_members WHERE family_id = ? AND role = ?',
            [familyId, 'head']
        );

        // If promoting someone to head, demote current head
        if (newRole === 'head' && currentHead.length > 0) {
            await pool.query(
                'UPDATE family_members SET role = ? WHERE family_id = ? AND role = ?',
                ['member', familyId, 'head']
            );
        }

        // Update the target user
        await pool.query(
            'UPDATE family_members SET role = ? WHERE family_id = ? AND user_id = ?',
            [newRole, familyId, userId]
        );

        return true;
    },

    // Update member nickname
    async updateMemberNickname(familyId, userId, nickname) {
        const pool = getPool();
        await pool.query(
            'UPDATE family_members SET nickname = ? WHERE family_id = ? AND user_id = ?',
            [nickname, familyId, userId]
        );
        return true;
    },

    // Check if user is family head
    async isFamilyHead(familyId, userId) {
        const pool = getPool();
        const [members] = await pool.query(
            'SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND role = ?',
            [familyId, userId, 'head']
        );
        return members.length > 0;
    },

    // Check if user is member of family
    async isFamilyMember(familyId, userId) {
        const pool = getPool();
        const [members] = await pool.query(
            'SELECT * FROM family_members WHERE family_id = ? AND user_id = ?',
            [familyId, userId]
        );
        return members.length > 0;
    },

    // ==================== USER LOOKUP ====================

    // Find user by email
    async findUserByEmail(email) {
        const pool = getPool();
        const [users] = await pool.query(
            'SELECT id, first_name, last_name, email, phone, role FROM users WHERE email = ?',
            [email]
        );
        return users[0] || null;
    },

    // Find user by ID
    async findUserById(userId) {
        const pool = getPool();
        const [users] = await pool.query(
            'SELECT id, first_name, last_name, email, phone, role FROM users WHERE id = ?',
            [userId]
        );
        return users[0] || null;
    },

    // ==================== RELATIONSHIP OPERATIONS ====================

    // Add relationship between two family members
    async addRelationship(data) {
        const pool = getPool();
        const { familyId, fromUserId, toUserId, relationshipType } = data;

        // Verify both users are members of the family
        const fromMember = await this.getFamilyMember(familyId, fromUserId);
        const toMember = await this.getFamilyMember(familyId, toUserId);

        if (!fromMember || !toMember) {
            throw new Error('Both users must be members of the family');
        }

        const relationshipId = uuidv4();
        await pool.query(
            'INSERT INTO family_relationships (id, family_id, from_user_id, to_user_id, relationship_type) VALUES (?, ?, ?, ?, ?)',
            [relationshipId, familyId, fromUserId, toUserId, relationshipType]
        );

        // Get the created relationship with user details
        const [relationships] = await pool.query(
            `SELECT fr.*, 
             u1.first_name as from_first_name, u1.last_name as from_last_name,
             u2.first_name as to_first_name, u2.last_name as to_last_name
             FROM family_relationships fr
             JOIN users u1 ON fr.from_user_id = u1.id
             JOIN users u2 ON fr.to_user_id = u2.id
             WHERE fr.id = ?`,
            [relationshipId]
        );

        return relationships[0];
    },

    // Get all relationships for a family
    async getRelationships(familyId) {
        const pool = getPool();
        const [relationships] = await pool.query(
            `SELECT fr.*, 
             u1.first_name as from_first_name, u1.last_name as from_last_name,
             u2.first_name as to_first_name, u2.last_name as to_last_name
             FROM family_relationships fr
             JOIN users u1 ON fr.from_user_id = u1.id
             JOIN users u2 ON fr.to_user_id = u2.id
             WHERE fr.family_id = ?
             ORDER BY fr.relationship_type, fr.created_at DESC`,
            [familyId]
        );
        return relationships;
    },

    // Remove relationship
    async removeRelationship(relationshipId) {
        const pool = getPool();
        await pool.query('DELETE FROM family_relationships WHERE id = ?', [relationshipId]);
        return true;
    },

    // Get user's relationships in a family
    async getUserRelationships(familyId, userId) {
        const pool = getPool();
        const [relationships] = await pool.query(
            `SELECT fr.*, 
             u1.first_name as from_first_name, u1.last_name as from_last_name,
             u2.first_name as to_first_name, u2.last_name as to_last_name
             FROM family_relationships fr
             JOIN users u1 ON fr.from_user_id = u1.id
             JOIN users u2 ON fr.to_user_id = u2.id
             WHERE fr.family_id = ? AND (fr.from_user_id = ? OR fr.to_user_id = ?)`,
            [familyId, userId, userId]
        );
        return relationships;
    }
};

module.exports = familyModel;

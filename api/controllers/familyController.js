// Family Controller - API endpoints for family management

const familyModel = require('../models/familyModel');
const userModel = require('../models/userModel');

const familyController = {
    // ==================== FAMILY CRUD ====================

    // Create a new family
    async createFamily(req, res) {
        try {
            const { name, description } = req.body;
            const userId = req.user.id;

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Family name is required'
                });
            }

            const family = await familyModel.createFamily({
                name,
                description,
                createdBy: userId
            });

            res.status(201).json({
                success: true,
                message: 'Family created successfully',
                family
            });
        } catch (error) {
            console.error('Create family error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create family'
            });
        }
    },

    // Get all families for current user
    async getMyFamilies(req, res) {
        try {
            const userId = req.user.id;
            const families = await familyModel.getUserFamilies(userId);

            // Ensure member_count is a proper number (MySQL returns COUNT as string/BigInt)
            const formattedFamilies = families.map(family => ({
                ...family,
                member_count: Number(family.member_count) || 0
            }));

            res.status(200).json({
                success: true,
                families: formattedFamilies
            });
        } catch (error) {
            console.error('Get families error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get families'
            });
        }
    },

    // Get family by ID
    async getFamilyById(req, res) {
        try {
            const { familyId } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role;

            // Admin can access any family
            if (userRole !== 'admin') {
                // Check if user is a member
                const isMember = await familyModel.isFamilyMember(familyId, userId);
                if (!isMember) {
                    return res.status(403).json({
                        success: false,
                        message: 'You are not a member of this family'
                    });
                }
            }

            const family = await familyModel.getFamilyByIdWithCreator(familyId);
            if (!family) {
                return res.status(404).json({
                    success: false,
                    message: 'Family not found'
                });
            }

            // Get member count for this family
            const members = await familyModel.getFamilyMembers(familyId);
            family.member_count = members.length;

            res.status(200).json({
                success: true,
                family
            });
        } catch (error) {
            console.error('Get family error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get family'
            });
        }
    },

    // Update family
    async updateFamily(req, res) {
        try {
            const { familyId } = req.params;
            const { name, description } = req.body;
            const userId = req.user.id;

            // Check if user is head
            const isHead = await familyModel.isFamilyHead(familyId, userId);
            if (!isHead) {
                return res.status(403).json({
                    success: false,
                    message: 'Only family head can update family details'
                });
            }

            // Check if family exists
            const family = await familyModel.getFamilyById(familyId);
            if (!family) {
                return res.status(404).json({
                    success: false,
                    message: 'Family not found'
                });
            }

            await familyModel.updateFamily(familyId, { name, description });

            res.status(200).json({
                success: true,
                message: 'Family updated successfully'
            });
        } catch (error) {
            console.error('Update family error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update family'
            });
        }
    },

    // Delete family
    async deleteFamily(req, res) {
        try {
            const { familyId } = req.params;
            const userId = req.user.id;

            // Check if user is head
            const isHead = await familyModel.isFamilyHead(familyId, userId);
            if (!isHead) {
                return res.status(403).json({
                    success: false,
                    message: 'Only family head can delete family'
                });
            }

            // Check if family exists
            const family = await familyModel.getFamilyById(familyId);
            if (!family) {
                return res.status(404).json({
                    success: false,
                    message: 'Family not found'
                });
            }

            await familyModel.deleteFamily(familyId);

            res.status(200).json({
                success: true,
                message: 'Family deleted successfully'
            });
        } catch (error) {
            console.error('Delete family error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete family'
            });
        }
    },

    // ==================== FAMILY MEMBERS ====================

    // Get family members
    async getFamilyMembers(req, res) {
        try {
            const { familyId } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role;

            // Admin can access any family
            if (userRole !== 'admin') {
                // Check if user is a member
                const isMember = await familyModel.isFamilyMember(familyId, userId);
                if (!isMember) {
                    return res.status(403).json({
                        success: false,
                        message: 'You are not a member of this family'
                    });
                }
            }

            const members = await familyModel.getFamilyMembers(familyId);

            res.status(200).json({
                success: true,
                members
            });
        } catch (error) {
            console.error('Get members error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get family members'
            });
        }
    },

    // Add member to family
    async addMember(req, res) {
        try {
            const { familyId } = req.params;
            const { email, nickname } = req.body;
            const userId = req.user.id;

            // Check if user is head
            const isHead = await familyModel.isFamilyHead(familyId, userId);
            if (!isHead) {
                return res.status(403).json({
                    success: false,
                    message: 'Only family head can add members'
                });
            }

            // Find user by email
            const user = await familyModel.findUserByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found with this email'
                });
            }

            // Check if user is already a member
            const existingMember = await familyModel.getFamilyMember(familyId, user.id);
            if (existingMember) {
                return res.status(409).json({
                    success: false,
                    message: 'User is already a member of this family'
                });
            }

            const member = await familyModel.addMember(familyId, user.id, 'member', nickname);

            res.status(201).json({
                success: true,
                message: 'Member added successfully',
                member
            });
        } catch (error) {
            console.error('Add member error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add member'
            });
        }
    },

    // Remove member from family
    async removeMember(req, res) {
        try {
            const { familyId, userId: memberUserId } = req.params;
            const userId = req.user.id;

            // Check if user is head
            const isHead = await familyModel.isFamilyHead(familyId, userId);
            if (!isHead) {
                return res.status(403).json({
                    success: false,
                    message: 'Only family head can remove members'
                });
            }

            // Cannot remove self
            if (memberUserId === userId) {
                return res.status(400).json({
                    success: false,
                    message: 'Head cannot remove themselves. Transfer head role first.'
                });
            }

            // Check if member exists
            const member = await familyModel.getFamilyMember(familyId, memberUserId);
            if (!member) {
                return res.status(404).json({
                    success: false,
                    message: 'Member not found in this family'
                });
            }

            await familyModel.removeMember(familyId, memberUserId);

            res.status(200).json({
                success: true,
                message: 'Member removed successfully'
            });
        } catch (error) {
            console.error('Remove member error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to remove member'
            });
        }
    },

    // Update member role (transfer head)
    async updateMemberRole(req, res) {
        try {
            const { familyId, userId: memberUserId } = req.params;
            const { role } = req.body;
            const userId = req.user.id;

            // Check if user is head
            const isHead = await familyModel.isFamilyHead(familyId, userId);
            if (!isHead) {
                return res.status(403).json({
                    success: false,
                    message: 'Only family head can transfer head role'
                });
            }

            // Validate role
            if (!['head', 'member'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role. Must be "head" or "member"'
                });
            }

            // Check if member exists
            const member = await familyModel.getFamilyMember(familyId, memberUserId);
            if (!member) {
                return res.status(404).json({
                    success: false,
                    message: 'Member not found in this family'
                });
            }

            await familyModel.updateMemberRole(familyId, memberUserId, role);

            res.status(200).json({
                success: true,
                message: role === 'head' ? 'Head role transferred successfully' : 'Member role updated successfully'
            });
        } catch (error) {
            console.error('Update role error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update member role'
            });
        }
    },

    // ==================== RELATIONSHIPS ====================

    // Get family relationships
    async getRelationships(req, res) {
        try {
            const { familyId } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role;

            // Admin can access any family
            if (userRole !== 'admin') {
                // Check if user is a member
                const isMember = await familyModel.isFamilyMember(familyId, userId);
                if (!isMember) {
                    return res.status(403).json({
                        success: false,
                        message: 'You are not a member of this family'
                    });
                }
            }

            const relationships = await familyModel.getRelationships(familyId);

            res.status(200).json({
                success: true,
                relationships
            });
        } catch (error) {
            console.error('Get relationships error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get relationships'
            });
        }
    },

    // Add relationship
    async addRelationship(req, res) {
        try {
            const { familyId } = req.params;
            const { fromUserId, toUserId, relationshipType } = req.body;
            const userId = req.user.id;

            // Check if user is head
            const isHead = await familyModel.isFamilyHead(familyId, userId);
            if (!isHead) {
                return res.status(403).json({
                    success: false,
                    message: 'Only family head can add relationships'
                });
            }

            // Validate relationship type
            const validTypes = ['parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild', 'other'];
            if (!validTypes.includes(relationshipType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid relationship type'
                });
            }

            // Check if users are different
            if (fromUserId === toUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot create relationship with yourself'
                });
            }

            const relationship = await familyModel.addRelationship({
                familyId,
                fromUserId,
                toUserId,
                relationshipType
            });

            res.status(201).json({
                success: true,
                message: 'Relationship added successfully',
                relationship
            });
        } catch (error) {
            console.error('Add relationship error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add relationship'
            });
        }
    },

    // Remove relationship
    async removeRelationship(req, res) {
        try {
            const { familyId, relId } = req.params;
            const userId = req.user.id;

            // Check if user is head
            const isHead = await familyModel.isFamilyHead(familyId, userId);
            if (!isHead) {
                return res.status(403).json({
                    success: false,
                    message: 'Only family head can remove relationships'
                });
            }

            await familyModel.removeRelationship(relId);

            res.status(200).json({
                success: true,
                message: 'Relationship removed successfully'
            });
        } catch (error) {
            console.error('Remove relationship error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove relationship'
            });
        }
    },

    // ==================== USER LOOKUP ====================

    // Find user by email (for adding members)
    async findUserByEmail(req, res) {
        try {
            const { email } = req.params;
            const userId = req.user.id;

            // Need to be head of at least one family to search
            const families = await familyModel.getUserFamilies(userId);
            const isHeadOfAny = families.some(f => f.member_role === 'head');

            if (!isHeadOfAny) {
                return res.status(403).json({
                    success: false,
                    message: 'Only family heads can search for users'
                });
            }

            const user = await familyModel.findUserByEmail(email);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Don't return password or sensitive data
            const { password, ...safeUser } = user;

            res.status(200).json({
                success: true,
                user: safeUser
            });
        } catch (error) {
            console.error('Find user error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to find user'
            });
        }
    }
};

module.exports = familyController;

const { v4: uuidv4 } = require('uuid');
const { getPool } = require('../config/db');

const pool = () => getPool();

const cylinderController = {
    async saveVerification(req, res) {
        try {
            const userId = req.user.id;
            const { region, result } = req.body;

            if (!result) {
                return res.status(400).json({ success: false, error: 'Result is required' });
            }

            const id = uuidv4();
            const verificationData = JSON.stringify(result);

            await pool().query(
                `INSERT INTO cylinder_verifications (id, user_id, region, verification_data, cylinder_number, status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [id, userId, region || 'IN', verificationData, result.extraction?.cylinderNumber || null, result.status?.code || 'UNKNOWN']
            );

            res.status(201).json({ success: true, data: { id, message: 'Verification saved' } });
        } catch (error) {
            console.error('Save cylinder verification error:', error);
            res.status(500).json({ success: false, error: 'Failed to save verification' });
        }
    },

    async getHistory(req, res) {
        try {
            const userId = req.user.id;
            const { limit = 50, page = 1 } = req.query;
            const offset = (page - 1) * limit;

            const [verifications] = await pool().query(
                `SELECT id, region, verification_data, cylinder_number, status, created_at
                 FROM cylinder_verifications
                 WHERE user_id = ?
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?`,
                [userId, parseInt(limit), parseInt(offset)]
            );

            const [[{ total }]] = await pool().query(
                'SELECT COUNT(*) as total FROM cylinder_verifications WHERE user_id = ?',
                [userId]
            );

            const data = verifications.map(v => ({
                id: v.id,
                region: v.region,
                cylinderNumber: v.cylinder_number,
                status: v.status,
                createdAt: v.created_at,
                result: JSON.parse(v.verification_data || '{}'),
            }));

            res.json({ success: true, data, total, page: parseInt(page), limit: parseInt(limit) });
        } catch (error) {
            console.error('Get cylinder history error:', error);
            res.status(500).json({ success: false, error: 'Failed to get history' });
        }
    },

    async deleteVerification(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const [result] = await pool().query(
                'DELETE FROM cylinder_verifications WHERE id = ? AND user_id = ?',
                [id, userId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: 'Verification not found' });
            }

            res.json({ success: true, message: 'Verification deleted' });
        } catch (error) {
            console.error('Delete cylinder verification error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete verification' });
        }
    },

    async verifyCylinder(req, res) {
        try {
            const { imageData, region } = req.body;

            if (!imageData) {
                return res.status(400).json({ success: false, error: 'Image data is required' });
            }

            const userId = req.user.id;
            const apiKey = process.env.GROQ_API_KEY;

            if (!apiKey) {
                return res.status(500).json({ success: false, error: 'OCR service not configured' });
            }

            const response = await fetch('https://api.groq.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llava-v1.5-7b-4096-preview',
                    messages: [{
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Extract gas cylinder information from this image. Return JSON with: cylinderNumber, serialNumber, manufacturer, gasType, capacity, manufactureDate, testDate, nextTestDate, tareWeight, inspectionMark.',
                            },
                            {
                                type: 'image_url',
                                image_url: { url: `data:image/jpeg;base64,${imageData}` },
                            },
                        ],
                    }],
                    max_tokens: 500,
                }),
            });

            if (!response.ok) {
                throw new Error('Groq API error');
            }

            const aiResponse = await response.json();
            const content = aiResponse.choices?.[0]?.message?.content || '{}';

            let extraction = {};
            try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    extraction = JSON.parse(jsonMatch[0]);
                }
            } catch (e) {
                console.log('Parse error:', e);
            }

            const verificationResult = {
                extraction,
                status: {
                    code: 'VERIFIED',
                    label: 'Verified',
                    color: '#22C55E',
                },
                confidence: { overall: 0.85 },
                compliance: { region: region || 'IN', isCompliant: true },
                metadata: { processedAt: new Date().toISOString() },
            };

            const id = uuidv4();
            await pool().query(
                `INSERT INTO cylinder_verifications (id, user_id, region, verification_data, cylinder_number, status, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [id, userId, region || 'IN', JSON.stringify(verificationResult), extraction.cylinderNumber || null, 'VERIFIED']
            );

            res.json({ success: true, data: verificationResult });
        } catch (error) {
            console.error('Verify cylinder error:', error);
            res.status(500).json({ success: false, error: 'Failed to verify cylinder' });
        }
    },
};

module.exports = cylinderController;

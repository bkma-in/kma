"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_POLICY = exports.DEFAULT_EDITORS = void 0;
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// ==========================================
// DEFAULT EDITORIAL BOARD & POLICY DATA
// ==========================================
exports.DEFAULT_EDITORS = [
    // Core Editorial Team
    {
        name: 'Thrivikraman T.',
        category: 'core',
        categoryTitle: 'Core Editorial Team',
        role: 'Advisory Editor',
        affiliation: 'Thekkedathu Mana,\nPerole-Palakkattu Link Road,\nNileshwar 671314, Kasaragod District, Kerala, India',
        email: 'thekkedathumana@gmail.com',
        areas: 'General Mathematics, Topology',
        order: 1,
        isActive: true,
    },
    {
        name: 'Krishnamoorthy A.',
        category: 'core',
        categoryTitle: 'Core Editorial Team',
        role: 'Chief Editor',
        affiliation: 'Department of Mathematics,\nCochin University of Science & Technology,\nCochin - 682 022, Kerala, India',
        email: 'akc@cusat.ac.in, akcusat@yahoo.com',
        areas: 'Probability Theory, Stochastic Processes, Queueing Theory',
        order: 2,
        isActive: true,
    },
    {
        name: 'Samuel M.S.',
        category: 'core',
        categoryTitle: 'Core Editorial Team',
        role: 'Executive Editor',
        affiliation: 'Mattathil, 15/64, Powath Road, Muttambalm,\nKottayam - 686 004, Kerala, India',
        email: 'ktmsamuelms@gmail.com',
        areas: 'Fuzzy Mathematics, Topology, Operations Research',
        order: 3,
        isActive: true,
    },
    // Academic Editors
    {
        name: 'Manigalambalam N.R.',
        category: 'academic',
        categoryTitle: 'Academic Editors',
        role: 'Academic Editor',
        affiliation: 'Department of Mathematics,\nSt. Joseph\'s College, Irinjalakuda - 680 121,\nKerala, India',
        email: 'thottuvai@sancharnet.in',
        areas: 'Algebra, Ring Theory',
        order: 1,
        isActive: true,
    },
    {
        name: 'Vinod Kumar P.B.',
        category: 'academic',
        categoryTitle: 'Academic Editors',
        role: 'Academic Editor',
        affiliation: 'Department of Mathematics,\nRajagiri School of Engineering & Technology,\nRajagiri Valley, Kakkanad, Cochin - 682 039',
        email: 'vinod_kumar@rajagiritech.ac.in',
        areas: 'Wavelets, Signal Processing, Applied Mathematics',
        order: 2,
        isActive: true,
    },
    // Associate Editors
    {
        name: 'K.T. Arasu',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'Department of Mathematics and Statistics, Wright State University, Dayton, OH 45435, U.S.A.',
        email: 'karasu@wright.edu',
        areas: 'Combinatorics, Graph Theory, Number Theory',
        order: 1,
        isActive: true,
    },
    {
        name: 'Bagheri Mohammad',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'P.O. Box 13145-1785, Tehran, Iran.',
        email: 'mohammad_bagheri2006@gmail.com',
        areas: 'History of Mathematics',
        order: 2,
        isActive: true,
    },
    {
        name: 'Bapat R.B.',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'Indian Statistical Institute, 7, SJS Marg, New Delhi - 110016, India.',
        email: 'rbb@isid.ac.in',
        areas: 'Non-negative Matrices, Generalized Inverses, Matrices and Graphs',
        order: 3,
        isActive: true,
    },
    {
        name: 'Choudum S.A.',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'Department of Mathematics, IIT Madras, Chennai - 600036, Tamil Nadu, India.',
        email: 'sac@iitm.ac.in',
        areas: 'Graph Theory, Combinatorics, Discrete Mathematics',
        order: 4,
        isActive: true,
    },
    {
        name: 'Comfort W.W.',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'Department of Mathematics, Wesleyan University, Middletown, CT 06459, U.S.A.',
        email: 'wcomfort@wesleyan.edu',
        areas: 'Set Theoretic Topology, Topological Groups',
        order: 5,
        isActive: true,
    },
    {
        name: 'Gupta R.C.',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'R-20, Ras Bahar Colony, Jhansi - 284003, Uttar Pradesh, India.',
        email: '',
        areas: 'History of Mathematics',
        order: 6,
        isActive: true,
    },
    {
        name: 'Jinnah M.I.',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'F2, Lavanya Flats, 4th Cross Street, Andal Nagar, Adambakkam, Chennai - 600088, Tamil Nadu, India.',
        email: 'jinnahmi@yahoo.co.in, jinnahmi@hotmail.com',
        areas: 'Commutative Algebra, Graph Theory',
        order: 7,
        isActive: true,
    },
    {
        name: 'Kaimal M.R.',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'Chairman, Department of Computer Science, Amrita Vishwa Vidyapeetham, Amritapuri, Kollam - 690525, Kerala, India.',
        email: 'mrkaimal@yahoo.com',
        areas: 'Computing Science, AI, Fuzzy Logic, Digital Image Processing, Algorithm Design, Software Metrics',
        order: 8,
        isActive: true,
    },
    {
        name: 'Kannan D.',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'Department of Mathematics, University of Georgia, Athens, Georgia 30602, U.S.A.',
        email: 'kannan@uga.edu',
        areas: 'Stochastic Equations, Bio-informatics, Engineering and Finances',
        order: 9,
        isActive: true,
    },
    {
        name: 'Kannan V.',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'Department of Mathematics & Statistics, University of Hyderabad, Hyderabad - 500046, Andhra Pradesh, India.',
        email: 'vksm@uohyd.ernet.in',
        areas: 'Analysis, Topology, Discrete Dynamical Systems',
        order: 10,
        isActive: true,
    },
    {
        name: 'Kesavan S.',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'The Institute of Mathematical Sciences, CIT Campus, Taramani, Chennai - 600113, Tamil Nadu, India.',
        email: 'kesh@imsc.res.in',
        areas: 'Analysis, Functional Analysis, Partial Differential Equations',
        order: 11,
        isActive: true,
    },
    {
        name: 'Nagabhushan P.',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'Bangalore Educational Society for Technology Advancement, Kodati, Off Sarjapur Road, Bengaluru, Karnataka, India.',
        email: 'pnagabhushan@hotmail.com',
        areas: 'Pattern Recognition, Image Processing, Remote Sensing, AI, Computer Vision',
        order: 12,
        isActive: true,
    },
    {
        name: 'Nambooripad K.S.S.',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'Komana, Thripadapuram, Kulathur, Thiruvananthapuram - 695583, Kerala, India.',
        email: 'kssn@tug.org.in',
        areas: 'Theory of Semigroups - Algebraic/Analytic, Semigroup Operators',
        order: 13,
        isActive: true,
    },
    {
        name: 'Rajagopalan M.',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: '10035, Woodland Grove Drive, Lakeland (TN) 38002, USA.',
        email: 'mrajagopalan@juno.com',
        areas: 'Topology, Functional Analysis',
        order: 14,
        isActive: true,
    },
    {
        name: 'Roychoudhury Rajkumar',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'Physics & Applied Mathematics Unit, ISI, Kolkata - 700108, West Bengal, India.',
        email: 'raj@isical.ac.in',
        areas: 'Quantum Mechanics, Solitary Waves, Non-linear Differential Equations, Theoretical Plasma Physics',
        order: 15,
        isActive: true,
    },
    {
        name: 'Srivastava A.K.',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'Department of Mathematics, Banaras Hindu University, Varanasi - 221005, Uttar Pradesh, India.',
        email: 'aks@banaras.ernet.in, rekhasri@bhu.ac.in',
        areas: 'Category Theory, Fuzzy Topology',
        order: 16,
        isActive: true,
    },
    {
        name: 'Stephen Watson',
        category: 'associate',
        categoryTitle: 'Associate Editors',
        role: 'Associate Editor',
        affiliation: 'York University, Department of Mathematics & Statistics, 4700 Keele Street, Toronto, Ontario, Canada M3J1P3.',
        email: 'mathstat@yorku.ca',
        areas: 'Topology',
        order: 17,
        isActive: true,
    }
];
exports.DEFAULT_POLICY = {
    policyText: 'The objective of the Bulletin is to publish original high quality and state of the art papers (in English language) in any area of Mathematical Sciences. Survey/Review articles are also welcome.',
    periodicityText: 'The journal will have one volume per year, with two issues published half-yearly. Also some special issues are brought out occasionally.',
    submissionGuidelines: 'Authors are encouraged to submit papers electronically - preferably in LaTeX to any of the Associate Editors in their area or to the Advisory Editor or to the Chief Editor or to any of the Academic Editors.\n\nIf electronic submission is not possible, authors may submit three copies of the manuscript to the Advisory Editor. Manuscript should not normally exceed 20 pages of A4 size paper in one-and-a-half line spacing with wide margins, printed on one side of the paper only.\n\nThe papers should be prepared in the following order: Title, Author(s), Affiliation, Brief Abstract, AMS2000 Subject Classification, Keywords, Main Text, Acknowledgements and References. Photo-ready copies of figures and tables should be inserted in the main text at the appropriate places. Sections within the paper should be decimally numbered.\n\nOne copy of the particular issue of the Bulletin containing the paper and soft copy of the paper will be supplied to the author(s) free of charge.',
    referencesFormat: 'References should be listed alphabetically (on first author\'s surname) in the following format:\n- L. Gillman and M. Jerison, Rings of Continuous Functions, Van Nostrand, Princeton, 1960.\n- L.A. Zadeh, Fuzzy Sets, Information and Control, 8 (1965) 338-358.',
    subscriptionText: 'Subscription rate per volume (two issues) including postage and handling charges:\n- Annual Subscription: Rs. 1000/- each in India.\n- Life members will receive 50% concession in the subscription charges.\n\nSubscription charges may be sent through Demand Draft / Online Transfer in favour of Bulletin of Kerala Mathematics Association, payable at Kottayam - 686 001. All correspondence including subscription orders and exchange proposals should be sent to the Executive Editor.',
    copyrightNotice: 'Copyright of the published papers is vested with the Kerala Mathematical Association.',
};
/**
 * Helper to ensure the editorial board collection is seeded if empty.
 */
async function ensureEditorialBoardSeeded() {
    try {
        const editorsSnapshot = await firebase_1.db.collection('editorial_board').limit(1).get();
        if (editorsSnapshot.empty) {
            console.log('[EDITORIAL] Seeding default editorial board...');
            const batch = firebase_1.db.batch();
            const now = new Date();
            for (const editor of exports.DEFAULT_EDITORS) {
                const docRef = firebase_1.db.collection('editorial_board').doc();
                batch.set(docRef, {
                    ...editor,
                    createdAt: now,
                    updatedAt: now,
                });
            }
            const policyRef = firebase_1.db.collection('editorial_policy').doc('current');
            batch.set(policyRef, {
                ...exports.DEFAULT_POLICY,
                updatedAt: now,
            });
            await batch.commit();
            console.log('[EDITORIAL] Seeding default editorial board completed successfully.');
        }
    }
    catch (error) {
        console.error('[EDITORIAL] Error seeding default editorial board:', error);
    }
}
// ==========================================
// PUBLIC ENDPOINTS
// ==========================================
// GET /api/editorial/board - Get active editorial board grouped by category + policy
router.get('/board', async (_req, res) => {
    try {
        await ensureEditorialBoardSeeded();
        const [editorsSnapshot, policyDoc] = await Promise.all([
            firebase_1.db.collection('editorial_board')
                .where('isActive', '==', true)
                .get(),
            firebase_1.db.collection('editorial_policy').doc('current').get()
        ]);
        let editors = [];
        editorsSnapshot.forEach(doc => {
            editors.push({ id: doc.id, ...doc.data() });
        });
        // Sort by order ascending
        editors.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        // Group into categories
        const core = editors.filter(e => e.category === 'core');
        const academic = editors.filter(e => e.category === 'academic');
        const associate = editors.filter(e => e.category === 'associate');
        const customCategories = {};
        editors.forEach(e => {
            if (!['core', 'academic', 'associate'].includes(e.category)) {
                const catKey = e.category || 'other';
                if (!customCategories[catKey]) {
                    customCategories[catKey] = [];
                }
                customCategories[catKey].push(e);
            }
        });
        const policy = policyDoc.exists ? policyDoc.data() : exports.DEFAULT_POLICY;
        res.json({
            success: true,
            editors,
            grouped: {
                core,
                academic,
                associate,
                custom: customCategories,
            },
            policy,
        });
    }
    catch (error) {
        console.error('Error fetching editorial board:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch editorial board data',
            editors: exports.DEFAULT_EDITORS,
            grouped: {
                core: exports.DEFAULT_EDITORS.filter(e => e.category === 'core'),
                academic: exports.DEFAULT_EDITORS.filter(e => e.category === 'academic'),
                associate: exports.DEFAULT_EDITORS.filter(e => e.category === 'associate'),
                custom: {},
            },
            policy: exports.DEFAULT_POLICY,
        });
    }
});
// GET /api/editorial/policy - Get editorial policy
router.get('/policy', async (_req, res) => {
    try {
        const policyDoc = await firebase_1.db.collection('editorial_policy').doc('current').get();
        const policy = policyDoc.exists ? policyDoc.data() : exports.DEFAULT_POLICY;
        res.json({ success: true, policy });
    }
    catch (error) {
        console.error('Error fetching editorial policy:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch policy', policy: exports.DEFAULT_POLICY });
    }
});
// ==========================================
// ADMIN ENDPOINTS
// ==========================================
// GET /api/editorial/admin/board - Get all editors (active + inactive) + policy
router.get('/admin/board', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (_req, res) => {
    try {
        await ensureEditorialBoardSeeded();
        const [editorsSnapshot, policyDoc] = await Promise.all([
            firebase_1.db.collection('editorial_board').get(),
            firebase_1.db.collection('editorial_policy').doc('current').get()
        ]);
        const editors = [];
        editorsSnapshot.forEach(doc => {
            editors.push({ id: doc.id, ...doc.data() });
        });
        editors.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        const policy = policyDoc.exists ? policyDoc.data() : exports.DEFAULT_POLICY;
        res.json({
            success: true,
            editors,
            policy,
        });
    }
    catch (error) {
        console.error('Admin error fetching editorial board:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch editorial board' });
    }
});
// POST /api/editorial/admin/editors - Create a new editor
router.post('/admin/editors', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { name, category, categoryTitle, role, affiliation, email, phone, areas, profileImage, order, isActive, } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Editor name is required' });
        }
        if (!category || !category.trim()) {
            return res.status(400).json({ success: false, error: 'Category is required' });
        }
        // Default categoryTitle based on category key if omitted
        let formattedCategoryTitle = categoryTitle?.trim();
        if (!formattedCategoryTitle) {
            if (category === 'core')
                formattedCategoryTitle = 'Core Editorial Team';
            else if (category === 'academic')
                formattedCategoryTitle = 'Academic Editors';
            else if (category === 'associate')
                formattedCategoryTitle = 'Associate Editors';
            else if (category === 'advisory')
                formattedCategoryTitle = 'Advisory Board';
            else
                formattedCategoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
        }
        const now = new Date();
        const newEditor = {
            name: name.trim(),
            category: category.trim().toLowerCase(),
            categoryTitle: formattedCategoryTitle,
            role: role?.trim() || 'Editor',
            affiliation: affiliation?.trim() || '',
            email: email?.trim() || '',
            phone: phone?.trim() || '',
            areas: areas?.trim() || '',
            profileImage: profileImage?.trim() || null,
            order: typeof order === 'number' ? order : 99,
            isActive: isActive !== false,
            createdAt: now,
            updatedAt: now,
        };
        const docRef = await firebase_1.db.collection('editorial_board').add(newEditor);
        res.status(201).json({
            success: true,
            message: 'Editor created successfully',
            editor: { id: docRef.id, ...newEditor },
        });
    }
    catch (error) {
        console.error('Error creating editor:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to create editor' });
    }
});
// PUT /api/editorial/admin/editors/:id - Update editor details
router.put('/admin/editors/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, categoryTitle, role, affiliation, email, phone, areas, profileImage, order, isActive, } = req.body;
        const editorRef = firebase_1.db.collection('editorial_board').doc(id);
        const doc = await editorRef.get();
        if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Editor not found' });
        }
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Editor name is required' });
        }
        let formattedCategoryTitle = categoryTitle?.trim();
        if (!formattedCategoryTitle && category) {
            if (category === 'core')
                formattedCategoryTitle = 'Core Editorial Team';
            else if (category === 'academic')
                formattedCategoryTitle = 'Academic Editors';
            else if (category === 'associate')
                formattedCategoryTitle = 'Associate Editors';
            else if (category === 'advisory')
                formattedCategoryTitle = 'Advisory Board';
            else
                formattedCategoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
        }
        const updateData = {
            name: name.trim(),
            updatedAt: new Date(),
        };
        if (category !== undefined)
            updateData.category = category.trim().toLowerCase();
        if (formattedCategoryTitle !== undefined)
            updateData.categoryTitle = formattedCategoryTitle;
        if (role !== undefined)
            updateData.role = role.trim();
        if (affiliation !== undefined)
            updateData.affiliation = affiliation.trim();
        if (email !== undefined)
            updateData.email = email.trim();
        if (phone !== undefined)
            updateData.phone = phone.trim();
        if (areas !== undefined)
            updateData.areas = areas.trim();
        if (profileImage !== undefined)
            updateData.profileImage = profileImage ? profileImage.trim() : null;
        if (order !== undefined)
            updateData.order = Number(order);
        if (isActive !== undefined)
            updateData.isActive = Boolean(isActive);
        await editorRef.update(updateData);
        const updatedDoc = await editorRef.get();
        res.json({
            success: true,
            message: 'Editor updated successfully',
            editor: { id: updatedDoc.id, ...updatedDoc.data() },
        });
    }
    catch (error) {
        console.error('Error updating editor:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to update editor' });
    }
});
// PATCH /api/editorial/admin/editors/:id/status - Toggle active/inactive
router.patch('/admin/editors/:id/status', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ success: false, error: 'isActive must be a boolean' });
        }
        const editorRef = firebase_1.db.collection('editorial_board').doc(id);
        const doc = await editorRef.get();
        if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Editor not found' });
        }
        await editorRef.update({
            isActive,
            updatedAt: new Date(),
        });
        res.json({
            success: true,
            message: `Editor ${isActive ? 'activated' : 'deactivated'} successfully`,
        });
    }
    catch (error) {
        console.error('Error toggling editor status:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to toggle status' });
    }
});
// DELETE /api/editorial/admin/editors/:id - Delete an editor
router.delete('/admin/editors/:id', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const editorRef = firebase_1.db.collection('editorial_board').doc(id);
        const doc = await editorRef.get();
        if (!doc.exists) {
            return res.status(404).json({ success: false, error: 'Editor not found' });
        }
        await editorRef.delete();
        res.json({
            success: true,
            message: 'Editor deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting editor:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to delete editor' });
    }
});
// PUT /api/editorial/admin/reorder - Batch update display orders
router.put('/admin/reorder', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { items } = req.body; // Array of { id: string, order: number }
        if (!Array.isArray(items)) {
            return res.status(400).json({ success: false, error: 'items array is required' });
        }
        const batch = firebase_1.db.batch();
        const now = new Date();
        for (const item of items) {
            if (item.id && typeof item.order === 'number') {
                const docRef = firebase_1.db.collection('editorial_board').doc(item.id);
                batch.update(docRef, {
                    order: item.order,
                    updatedAt: now,
                });
            }
        }
        await batch.commit();
        res.json({
            success: true,
            message: 'Editorial board reordered successfully',
        });
    }
    catch (error) {
        console.error('Error reordering editors:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to reorder editors' });
    }
});
// PUT /api/editorial/admin/policy - Update editorial policy
router.put('/admin/policy', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (req, res) => {
    try {
        const { policyText, periodicityText, submissionGuidelines, referencesFormat, subscriptionText, copyrightNotice, } = req.body;
        const policyRef = firebase_1.db.collection('editorial_policy').doc('current');
        const updateData = {
            updatedAt: new Date(),
        };
        if (policyText !== undefined)
            updateData.policyText = policyText;
        if (periodicityText !== undefined)
            updateData.periodicityText = periodicityText;
        if (submissionGuidelines !== undefined)
            updateData.submissionGuidelines = submissionGuidelines;
        if (referencesFormat !== undefined)
            updateData.referencesFormat = referencesFormat;
        if (subscriptionText !== undefined)
            updateData.subscriptionText = subscriptionText;
        if (copyrightNotice !== undefined)
            updateData.copyrightNotice = copyrightNotice;
        await policyRef.set(updateData, { merge: true });
        const updatedDoc = await policyRef.get();
        res.json({
            success: true,
            message: 'Editorial policy updated successfully',
            policy: updatedDoc.data(),
        });
    }
    catch (error) {
        console.error('Error updating editorial policy:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to update policy' });
    }
});
// POST /api/editorial/admin/reset-policy - Reset only editorial policy to defaults
router.post('/admin/reset-policy', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (_req, res) => {
    try {
        const policyRef = firebase_1.db.collection('editorial_policy').doc('current');
        await policyRef.set({
            ...exports.DEFAULT_POLICY,
            updatedAt: new Date(),
        });
        res.json({
            success: true,
            message: 'Editorial policy reset to official defaults successfully',
            policy: exports.DEFAULT_POLICY,
        });
    }
    catch (error) {
        console.error('Error resetting editorial policy:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to reset policy' });
    }
});
// POST /api/editorial/admin/seed-defaults - Force re-seed default editorial board
router.post('/admin/seed-defaults', authMiddleware_1.requireAuth, (0, authMiddleware_1.requireRole)(['admin']), async (_req, res) => {
    try {
        // Delete existing editorial board
        const existing = await firebase_1.db.collection('editorial_board').get();
        const batch = firebase_1.db.batch();
        existing.forEach(doc => {
            batch.delete(doc.ref);
        });
        const now = new Date();
        for (const editor of exports.DEFAULT_EDITORS) {
            const docRef = firebase_1.db.collection('editorial_board').doc();
            batch.set(docRef, {
                ...editor,
                createdAt: now,
                updatedAt: now,
            });
        }
        const policyRef = firebase_1.db.collection('editorial_policy').doc('current');
        batch.set(policyRef, {
            ...exports.DEFAULT_POLICY,
            updatedAt: now,
        });
        await batch.commit();
        res.json({
            success: true,
            message: 'Editorial board reset to default official dataset successfully',
        });
    }
    catch (error) {
        console.error('Error resetting editorial board defaults:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to reset defaults' });
    }
});
exports.default = router;

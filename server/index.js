require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const { processConversation, clearConversation } = require('./services/conversationService');

const app = express();
app.use(cors());
app.use(express.json());

// Multer for image uploads
const upload = multer({ storage: multer.memoryStorage() });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Error:", err));

// Schema
const Product = mongoose.model('Product', new mongoose.Schema({
    title: String,
    price: Number,
    image_url: String,
    link: String,
    category: String,
    color: String,
    embedding: [Number]
}));

// Math: Cosine Similarity (Normalized)
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magA * magB);
}

// Helper: Search products with filters
async function searchProducts(vector, filters = {}) {
    const query = {};
    
    if (filters.minPrice) query.price = { $gte: filters.minPrice };
    if (filters.maxPrice) query.price = { ...query.price, $lte: filters.maxPrice };
    if (filters.category) query.category = new RegExp(filters.category, 'i');
    if (filters.color) query.title = new RegExp(filters.color, 'i');
    
    const products = await Product.find(query);
    
    const results = products.map(p => ({
        ...p._doc,
        score: cosineSimilarity(vector, p.embedding)
    }))
    .filter(p => p.score > 0.1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

    return results;
}

// ============================================
// ROUTES
// ============================================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Synapse Commerce API' });
});

// --------------------------------------------
// 🔍 TEXT SEARCH
// --------------------------------------------
app.post('/api/search/text', async (req, res) => {
    try {
        const { query, maxPrice, minPrice, category } = req.body;
        console.log(`🔎 Text Search: "${query}"`);

        const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/vectorize/text`, { text: query });
        const vector = aiRes.data.vector;

        const results = await searchProducts(vector, { maxPrice, minPrice, category });

        res.json(results);
    } catch (e) {
        console.error('Text Search Error:', e.message);
        res.status(500).json({ error: 'Search failed', details: e.message });
    }
});

// --------------------------------------------
// 📷 IMAGE SEARCH
// --------------------------------------------
app.post('/api/search/image', upload.single('image'), async (req, res) => {
    try {
        console.log(`📷 Image Search`);
        const maxPrice = req.body.maxPrice ? parseFloat(req.body.maxPrice) : null;

        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/vectorize/image`, formData, {
            headers: formData.getHeaders()
        });
        const vector = aiRes.data.vector;

        const results = await searchProducts(vector, { maxPrice });

        res.json(results);
    } catch (e) {
        console.error('Image Search Error:', e.message);
        res.status(500).json({ error: 'Image search failed', details: e.message });
    }
});

// --------------------------------------------
// 🔄 SIMILAR PRODUCTS
// --------------------------------------------
app.get('/api/products/similar/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        console.log(`🔄 Finding similar to: "${product.title}"`);

        const results = await searchProducts(product.embedding, {});
        const filtered = results.filter(p => p._id.toString() !== req.params.id);

        res.json(filtered);
    } catch (e) {
        console.error('Similar Search Error:', e.message);
        res.status(500).json({ error: 'Similar search failed', details: e.message });
    }
});

// --------------------------------------------
// 🧠 CONVERSATIONAL SEARCH (The Magic!)
// --------------------------------------------
app.post('/api/search/converse', async (req, res) => {
    try {
        const { message, sessionId, context } = req.body;
        console.log(`💬 Conversation [${sessionId}]: "${message}"`);

        // Step 1: Process with AI to understand intent
        const aiResponse = await processConversation(sessionId, message, context);
        
        console.log('🤖 AI Understanding:', aiResponse.summary);

        // Step 2: If clarification needed, return early
        if (aiResponse.clarification) {
            return res.json({
                type: 'clarification',
                question: aiResponse.clarification,
                sessionId: aiResponse.sessionId
            });
        }

        // Step 3: Get vector for the search query
        let vector;
        if (aiResponse.searchQuery) {
            const vectorRes = await axios.post(`${process.env.AI_SERVICE_URL}/vectorize/text`, { 
                text: aiResponse.searchQuery 
            });
            vector = vectorRes.data.vector;
        } else if (context?.lastVector) {
            vector = context.lastVector;
        }

        // Step 4: Search with AI-extracted filters
        const results = await searchProducts(vector, aiResponse.filters);

        res.json({
            type: 'results',
            results,
            searchQuery: aiResponse.searchQuery,
            filters: aiResponse.filters,
            intent: aiResponse.intent,
            summary: aiResponse.summary,
            sessionId: aiResponse.sessionId,
            vector
        });

    } catch (e) {
        console.error('Conversation Error:', e.message);
        res.status(500).json({ error: 'Conversation failed', details: e.message });
    }
});

// Clear conversation history
app.post('/api/search/converse/clear', (req, res) => {
    const { sessionId } = req.body;
    clearConversation(sessionId);
    res.json({ success: true, message: 'Conversation cleared' });
});

// --------------------------------------------
// 📊 GET ALL PRODUCTS
// --------------------------------------------
app.get('/api/products', async (req, res) => {
    try {
        const { limit = 20, category } = req.query;
        const query = category ? { category: new RegExp(category, 'i') } : {};
        const products = await Product.find(query).limit(parseInt(limit));
        res.json(products);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on Port ${PORT}`));
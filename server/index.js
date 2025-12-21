require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

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
    embedding: [Number] 
}));

// Math: Cosine Similarity
function cosineSimilarity(vecA, vecB) {
    return vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
}

// Route: Search
app.post('/api/search', async (req, res) => {
    try {
        const { query } = req.body;
        console.log(`🔎 Searching for: "${query}"`);

        // 1. Get Vector from Python
        const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/vectorize/text`, { text: query });
        const vector = aiRes.data.vector;

        // 2. Fetch & Rank Products
        const products = await Product.find({});
        const results = products.map(p => ({
            ...p._doc,
            score: cosineSimilarity(vector, p.embedding)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

        res.json(results);
    } catch (e) {
        console.error(e);
        res.status(500).send("Server Error");
    }
});

app.listen(5000, () => console.log("🚀 Server running on Port 5000"));
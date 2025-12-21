require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const Product = mongoose.model('Product', new mongoose.Schema({
    title: String,
    price: Number,
    image_url: String,
    link: String,
    category: String,
    embedding: [Number]
}));

const items = [
    { title: "Red Wool Scarf", price: 25, category: "Apparel", link: "https://amazon.com", image_url: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=500" },
    { title: "Denim Jacket", price: 60, category: "Apparel", link: "https://levis.com", image_url: "https://images.unsplash.com/photo-1551028919-383718cccf35?w=500" },
    { title: "Leather Boots", price: 120, category: "Shoes", link: "https://nike.com", image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500" }
];

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany({});

    for (const item of items) {
        console.log(`Processing ${item.title}...`);
        const res = await axios.post(`${process.env.AI_SERVICE_URL}/vectorize/text`, { text: item.title });
        await Product.create({ ...item, embedding: res.data.vector });
    }
    console.log("✅ Done!");
    process.exit();
}
seed();
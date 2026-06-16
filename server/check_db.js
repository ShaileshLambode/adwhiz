const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);
require('dotenv').config({ path: './.env' });

const LogoSchema = new mongoose.Schema({
    name: String,
});

const Logo = mongoose.model('Logo', LogoSchema);

async function checkLogos() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const logos = await Logo.find({});
        console.log('Existing Business Names in DB:');
        logos.forEach(l => console.log(`- ${l.name}`));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkLogos();

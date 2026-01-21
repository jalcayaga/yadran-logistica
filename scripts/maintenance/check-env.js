require('dotenv').config({ path: '.env.local' });

if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL found");
} else {
    console.log("DATABASE_URL not found");
}

if (process.env.DIRECT_URL) {
    console.log("DIRECT_URL found");
} else {
    console.log("DIRECT_URL not found");
}

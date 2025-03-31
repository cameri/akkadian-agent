console.log('Initializing MongoDB database...');
console.log({
    MONGODB_USERNAME: process.env.MONGODB_USERNAME,
    MONGODB_PASSWORD: process.env.MONGODB_PASSWORD,
    MONGO_INITDB_DATABASE: process.env.MONGO_INITDB_DATABASE,
});

console.log('Current database:', db.getName());
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE);
console.log('Current database:', db.getName());
db.createUser({
    user: process.env.MONGODB_USERNAME,
    pwd: process.env.MONGODB_PASSWORD,
    roles: [{
        role: "readWrite",
        db: "admin",
    }],
});

console.log('Initializing MongoDB database... Done.');


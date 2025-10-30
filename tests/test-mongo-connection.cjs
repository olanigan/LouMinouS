const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB Atlas connection string
const uri = "mongodb+srv://salalite:salalite8@cluster0.s8mcne6.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    console.log('Connecting to MongoDB Atlas...');

    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    console.log("✅ SUCCESS: Pinged your deployment. You successfully connected to MongoDB!");

    // List available databases
    const databases = await client.db().admin().listDatabases();
    console.log('\nAvailable databases:');
    databases.databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });

  } catch (error) {
    console.error('❌ ERROR: Failed to connect to MongoDB:');
    console.error(error.message);
    process.exit(1);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
    console.log('\n✅ Connection closed successfully.');
  }
}

run().catch(console.dir);

const http = require('http');
const path = require("path");
const fetch = require('node-fetch');
require("dotenv").config({ path: path.resolve(__dirname, '.env') }) 




const express = require('express');
let portNumber;
const bodyParser = require("body-parser");
const httpSuccessStatus = 200;
const webServer = http.createServer((request, response) => {
	response.writeHead(httpSuccessStatus, {'Content-type':'text/html'});
	response.write('<h1>Web Server (NodeJS based) Running</h1>');
	response.end();
});


const app = express();
//webServer.listen(portNumber); 
process.stdin.setEncoding("utf8");

if (process.argv.length != 3) {
  console.log(`Wrong input format`);
  process.exit(1);
}

portNumber = process.argv[2];


console.log(`Web server started and running at http://localhost:${portNumber}`);
prompt = "Stop to shutdown the server: "
process.stdout.write(prompt);
process.stdin.setEncoding("utf8"); /* encoding */
process.stdin.on('readable', () => {  /* on equivalent to addEventListener */
	let dataInput = process.stdin.read();
	if (dataInput !== null) {
		let command = dataInput.trim();
		if (command === "stop") {
			console.log("Shutting down the server");
      process.exit(0);  /* exiting */
    }
    else {
			/* After invalid command, we cannot type anything else */
			console.log(`Invalid command: ${command}`);
		}
        process.stdout.write(prompt);
        process.stdin.resume();
    }
});
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(__dirname + '/styleStuff'));
app.get("/", async (request, response) => {

    response.render("home");
 });
app.get("/form", async (request, response) => { 

    response.render("form");
}); 

//app.post("/apply", async (request, response) => {    
 //   response.redirect("/processApplication");  
//}); 
const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const name = process.env.MONGO_DB_NAME;
const collect = process.env.MONGO_COLLECTION;

const databaseAndCollection = {db: name, collection: collect};
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${userName}:${password}@cluster0.iynmeym.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
app.post("/processInfo", async (request, response) =>{

     let appToAdd = { firstName: request.body.firstName,
        lastName : request.body.lastName,
        pokemon : request.body.pokemon}

        try {
            await client.connect();
            await insertApp(client, databaseAndCollection, appToAdd);
    
        } catch (e) {
            console.error(e);
        } finally {
            await client.close();
        }
    
        async function insertApp(client, databaseAndCollection, applicationArray) {
            const result = await client.db(databaseAndCollection.db)
                                .collection(databaseAndCollection.collection)
                                .insertOne(applicationArray);
        }
    response.render("processInfo", appToAdd);
});


app.get("/lookup", async (request, response) =>{
    response.render("lookup");
});
app.post("/processLookup", async (request, response) =>{
    let firstNameLookup = request.body.firstNameLookup;
    let lastNameLookup = request.body.lastNameLookup;
    let data;
    try {
        await client.connect();
        let output;
        await lookUpOneEntry(client, databaseAndCollection, firstNameLookup, lastNameLookup);

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    async function lookUpOneEntry(client, databaseAndCollection, firstNameLookup, lastNameLookup) {
        let filter = {firstName : { $eq: firstNameLookup}, lastName: {$eq: lastNameLookup}};
        const result = await client.db(databaseAndCollection.db)
                        .collection(databaseAndCollection.collection)
                        .findOne(filter);

   if (result) {
        const variables = { 
        firstName: result.firstName,
        lastName: result.lastName,
        pokemon: result.pokemon
        };
        data = variables;
   } else {
       console.log(`No pokemon found with name ${firstNameLookup} and ${lastNameLookup}`);
   }
    
    }
    
    
    response.render("processInfo", data);
    

});
app.get("/api", async (request, response) =>{
    response.render("api");
});

app.post("/processAPI", async (request, response) =>{
    
    const pokemonAPI = request.body.pokemonAPI.toLowerCase();
    var pokemonData;
    let data;
   try{
    const url = "https://pokeapi.co/api/v2/pokemon/"+pokemonAPI+"/";
    const res = await fetch(url);
    if(!res.ok){
        throw await res.json();
    }
    const data = await res.json();//assuming data is json
    const variables = { 
        pokemonName: pokemonAPI,
        pokemonWeight: data.weight,
        pokemonHeight: data.height,
        pokemonImg: data.sprites.other.home.front_default
    };
    response.render("processAPI", variables);
    }
    catch(e){
        response.render("error");
    }
    
    
});
app.get("/pokemonRemove", async (request, response) =>{
    response.render("pokemonRemove");
});
app.post("/processPokemonRemove", async (request, response) =>{
    let deleted;
    try {
        await client.connect();
        const result = await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
        deleted =  result.deletedCount;
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    const variables = { 
        pokRemoved: deleted
    };
    
    response.render("processPokemonRemove", variables);
    
}); 

app.listen(portNumber);

import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import http from "http";

// Configuration Settings from config file, .env file
import { PORT, connectMongoDB } from "./config";
import { TESTNET } from "./config/config";

// Mutex for API Rate limit protection functionality
import { Mutex } from "async-mutex";

// Swagger UI implementation
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

// API endpoint Routers
import ListingRouter from "./routes/ListingRoute/create-listing.route";
import SaveListingRouter from "./routes/ListingRoute/save-listing.route";
import DeleteListingRouter from "./routes/ListingRoute/delete-listing.route";
import UpdateListingRouter from "./routes/ListingRoute/update-listing.route";
import CreateOfferRouter from "./routes/OfferRoute/create-offer.route";
import SubmitOfferRouter from "./routes/OfferRoute/submit-offer.route";

// Mutex Variable setting for API Rate Limit functionality
export const flagMutex = new Mutex();
export const iterator = new Mutex();

// Load environment variables from .env file
dotenv.config();

// Initialize Swgger UI
let swaggerDocument: any = "";

if (process.env.NETWORKTYPE == TESTNET) {
  swaggerDocument = YAML.load("swagger_devnet.yaml");
} else {
  swaggerDocument = YAML.load("swagger_mainnet.yaml");
}

// Connect to the MongoDB database
connectMongoDB();

// Create an instance of the Express application
const app = express();

// Set up Cross-Origin Resource Sharing (CORS) options
app.use(cors());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "./public")));

// Parse incoming JSON requests using body-parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

const server = http.createServer(app);

// Define routes for different API endpoints
app.use("/api", ListingRouter);
app.use("/api", SaveListingRouter);
app.use("/api", DeleteListingRouter);
app.use("/api", UpdateListingRouter);
app.use("/api", CreateOfferRouter);
app.use("/api", SubmitOfferRouter);

// Define a route to check if the backend server is running
app.get("/", async (req: any, res: any) => {
  res.send("Backend Server is Running now!");
});

// Swagger endpoint Settings
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, { explorer: true })
);

// Set Global Variable Iterator for unisat api distribution
app.locals.iterator = 0;

// Start the Express server to listen on the specified port
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

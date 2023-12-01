// index.js

const express = require("express");
const { PrismaClient } = require("./generated/client");
// const Webhook = require('@clerk/clerk-sdk-node');
const { Webhook } = require("svix");

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Webhook handler
app.post("/webhook", async (req, res) => {
  console.log("Headers:", req.headers);

  try {
    const payload = JSON.stringify(req.body);
    const headers = req.headers;
    const wh = new Webhook(process.env.CLERK_WEBHOOK);
    const evt = wh.verify(payload, headers);
    const { id } = evt.data;

    const eventType = evt.type;

    // Get the Svix headers for verification
    const svix_id = headers["svix-id"];
    const svix_timestamp = headers["svix-timestamp"];
    const svix_signature = headers["svix-signature"];

    // If there are missing Svix headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error occured -- no svix headers", {
        status: 400,
      });
    }

    if (eventType === "user.created") {
      // Look for existing user
      const existingUser = await prisma.user.findUnique({
        where: { id: id },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: id,
            username: "default_username",
            email: "default_email",
            metamask: "default_metamask",
            score: 0,
            // Add other fields as needed
          },
        });
        console.log(`User ${id} was created`);
      } else {
        console.log(`User ${id} already exists`);
      }
    }

    res.status(200).json({
      success: true,
      message: "Webhook received",
    });
  } catch (err) {
    const errorMessage = `Webhook verification failed: ${err.message}`;
    console.error(errorMessage);
    res.status(400).json({
      success: false,
      message: errorMessage,
    });
  }
});

// Other routes and server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

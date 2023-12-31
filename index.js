// // index.js

// const express = require("express");
// const { PrismaClient } = require("./generated/client");
// // const Webhook = require('@clerk/clerk-sdk-node');
// const { Webhook } = require("svix");

// const app = express();
// const prisma = new PrismaClient();

// app.use(express.json());

// // Webhook handler
// app.post("/webhook", async (req, res) => {
//   console.log("Headers:", req.headers);

//   try {
//     const payload = JSON.stringify(req.body);
//     const headers = req.headers;
//     const wh = new Webhook(process.env.CLERK_WEBHOOK);
//     const evt = wh.verify(payload, headers);
//     const { id } = evt.data;

//     const eventType = evt.type;

//     // Get the Svix headers for verification
//     const svix_id = headers["svix-id"];
//     const svix_timestamp = headers["svix-timestamp"];
//     const svix_signature = headers["svix-signature"];

//     // If there are missing Svix headers, error out
//     if (!svix_id || !svix_timestamp || !svix_signature) {
//       return new Response("Error occurred -- no svix headers", {
//         status: 400,
//       });
//     }

//     if (eventType === "user.created") {
//       // Look for existing user using user_id
//       const existingUser = await prisma.user.findUnique({
//         where: { user_id: id },
//       });

//       if (!existingUser) {
//         await prisma.user.create({
//           data: {
//             user_id: id,
//             username: "default_username",
//             email: "default_email",
//             metamask: "default_metamask",
//             score: 0,
//             // Add other fields as needed
//           },
//         });
//         console.log(`User ${id} was created`);
//       } else {
//         console.log(`User ${id} already exists`);
//       }
//     }

//     res.status(200).json({
//       success: true,
//       message: "Webhook received",
//     });
//   } catch (err) {
//     const errorMessage = `Webhook verification failed: ${err.message}`;
//     console.error(errorMessage);
//     res.status(400).json({
//       success: false,
//       message: errorMessage,
//     });
//   }
// });

// // Other routes and server setup
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });





const express = require("express");
const { PrismaClient } = require("./generated/client");
const { Webhook } = require("svix");

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.post("/webhook", async (req, res) => {
  console.log("Headers:", req.headers);

  try {
    const payload = JSON.stringify(req.body);
    const headers = req.headers;
    const wh = new Webhook(process.env.CLERK_WEBHOOK);
    const evt = wh.verify(payload, headers);

    const eventType = evt.type;

    // Ensure the event is for user creation
    if (eventType === "user.created") {
      // Extract user information from the payload
      const { id, email_addresses, first_name, last_name } = evt.data;

      // Use the first email address as the user's email
      const email = email_addresses?.[0]?.email || "default_email";

      // Look for an existing user using user_id
      const existingUser = await prisma.user.findUnique({
        where: { user_id: id },
      });

      if (!existingUser) {
        // User does not exist, create a new user
        await prisma.user.create({
          data: {
            user_id: id,
            username: `${first_name} ${last_name}` || "default_username",
            email: email,
            metamask: "default_metamask",
            score: 0,
            // Add other fields as needed
          },
        });

        console.log(`User ${id} was created`);
      } else {
        // User already exists
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.MONGODB_CLOUD_NAME,
  api_key: process.env.MONGODB_API_KEY,
  api_secret: process.env.MONGODB_API_SECRET
});

const User = require("../models/User");
const Offer =  require("../models/Offer");

const isAuthenticated = async (req, res, next) => {
  // console.log(req.headers.authorization);
  if (req.headers.authorization) {
    const user = await User.findOne({
      token: req.headers.authorization.replace("Bearer ", "")
    });
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    } else {
      req.user = user; 
      return next();
    }
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

router.post("/offer/publish", fileUpload(), isAuthenticated, async (req, res) => {
  // console.log(req.body);
  // console.log(req.files);
  try {
      const offer = new Offer({
          product_name: req.body.title,
          product_description: req.body.description,
          product_price: req.body.price,
          product_details: req.body.details,
          owner: req.user
      });
      await offer.save();
      const pictureToUpload = req.files.picture;
      const offerId = offer.id;
      const result = await cloudinary.uploader.upload(convertToBase64(pictureToUpload), {folder: "/vinted/offers/" + offerId});
      return res.status(201).json(result);
  } catch (error) {
      res.status(400).json(error.message);
  }
});

router.get("/offers", async (req, res) => {
    try {
      // const offers = await Offer.find({
      //   product_name: req.query.title,
      //   product_price: {
      //     $gte: req.query.priceMin,
      //     $lte: req.query.priceMax
      //   }
      // });
      // OU
      const filters = {};
      if (req.query.title) {
        filters.product_name = new RegExp(req.query.title, "i");
      }
      if (req.query.priceMin) {
        filters.product_name = {$gte: req.query.priceMin};
      }
      if (req.query.priceMax) {
        filters.product_price = {$lte: req.query.priceMax};
      }
      const sorting = {};
      if (req.query.sort) {
        if (req.query.sort === "price-desc") {
          sorting.product_name = -1;
        }
        if (req.query.sort === "price-asc") {
          sorting.product_name = 1;
        }
      }
      let skipping = 1;
      if (req.query.page) {
        skipping = skipping * req.query.page;
      }
      const offers = await Offer.find(filters).sort(sorting).limit(2).skip(2 * skipping);
      res.status(200).json(offers);
    } catch (error) {
      res.status(400).json(error.message);
    }
  }
);

module.exports = router;
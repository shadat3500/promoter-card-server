const express = require("express");
const config = require("../../config/config");
const authRoute = require("./auth.routes");
const userRoute = require("./user.routes");
const venueRoute = require("./venue.routes");
const pricingRoute = require("./pricing.routes");
const docsRoute = require("./docs.routes");

const router = express.Router();

const defaultRoutes = [
  { path: "/auth", route: authRoute },
  { path: "/users", route: userRoute },
  { path: "/venues", route: venueRoute },
  { path: "/pricing", route: pricingRoute },
];

const devRoutes = [
  { path: "/docs", route: docsRoute },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

if (config.env === "development") {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;

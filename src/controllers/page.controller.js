const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const pageService = require("../services/page.service");

// GET /venues/me/page
const getPageConfig = catchAsync(async (req, res) => {
  const data = await pageService.getPageConfig(req.user.id);
  res.status(httpStatus.OK).json(
    response({ message: "Page config fetched", status: "OK", statusCode: httpStatus.OK, data })
  );
});

// PUT /venues/me/page
const savePageConfig = catchAsync(async (req, res) => {
  const { slug, pageTitle, pageBlocks } = req.body;
  const data = await pageService.savePageConfig(req.user.id, { slug, pageTitle, pageBlocks });
  res.status(httpStatus.OK).json(
    response({ message: "Page config saved", status: "OK", statusCode: httpStatus.OK, data })
  );
});

module.exports = { getPageConfig, savePageConfig };

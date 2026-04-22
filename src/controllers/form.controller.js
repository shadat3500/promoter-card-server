const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const response = require("../config/response");
const formService = require("../services/form.service");

// GET /venues/me/form
const getFormFields = catchAsync(async (req, res) => {
  const data = await formService.getFormFields(req.user.id);
  res.status(httpStatus.OK).json(
    response({ message: "Form fields fetched", status: "OK", statusCode: httpStatus.OK, data })
  );
});

// PUT /venues/me/form
const saveFormFields = catchAsync(async (req, res) => {
  const fields = Array.isArray(req.body.fields) ? req.body.fields : [];
  const data = await formService.saveFormFields(req.user.id, fields);
  res.status(httpStatus.OK).json(
    response({ message: "Form fields saved", status: "OK", statusCode: httpStatus.OK, data })
  );
});

// GET /venues/slug/:slug/published  — public
const getPublishedData = catchAsync(async (req, res) => {
  const data = await formService.getPublishedData(req.params.slug);
  res.status(httpStatus.OK).json(
    response({ message: "Published data fetched", status: "OK", statusCode: httpStatus.OK, data })
  );
});

module.exports = { getFormFields, saveFormFields, getPublishedData };

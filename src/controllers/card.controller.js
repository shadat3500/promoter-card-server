const httpStatus = require("http-status");
const cardService = require("../services/card.service");
const catchAsync = require("../utils/catchAsync");

const getCards = catchAsync(async (req, res) => {
  const cards = await cardService.getCards(req.user.id);
  res.json({ status: "success", statusCode: 200, message: "Cards fetched", data: cards });
});

const createCard = catchAsync(async (req, res) => {
  const card = await cardService.createCard(req.user.id, req.body);
  res.status(httpStatus.CREATED).json({ status: "success", statusCode: 201, message: "Card created", data: card });
});

const updateCard = catchAsync(async (req, res) => {
  const card = await cardService.updateCard(req.user.id, req.params.cardId, req.body);
  res.json({ status: "success", statusCode: 200, message: "Card updated", data: card });
});

const deleteCard = catchAsync(async (req, res) => {
  await cardService.deleteCard(req.user.id, req.params.cardId);
  res.json({ status: "success", statusCode: 200, message: "Card deleted", data: null });
});

module.exports = { getCards, createCard, updateCard, deleteCard };

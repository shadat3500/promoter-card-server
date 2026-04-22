const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const response = require("../config/response");
const gameService = require("../services/game.service");

// GET /venues/me/game
const getGameConfig = catchAsync(async (req, res) => {
  const data = await gameService.getGameConfig(req.user.id);
  res.status(httpStatus.OK).json(
    response({ message: "Game config fetched", status: "OK", statusCode: httpStatus.OK, data })
  );
});

// PATCH /venues/me/game  — update gameType only
const updateGameType = catchAsync(async (req, res) => {
  const { gameType } = req.body;
  if (!["dice", "spin_wheel"].includes(gameType)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "gameType must be 'dice' or 'spin_wheel'");
  }
  const data = await gameService.updateGameType(req.user.id, gameType);
  res.status(httpStatus.OK).json(
    response({ message: "Game type updated", status: "OK", statusCode: httpStatus.OK, data })
  );
});

// PUT /venues/me/game/prizes  — bulk replace all prizes
const bulkSavePrizes = catchAsync(async (req, res) => {
  const prizes = Array.isArray(req.body.prizes) ? req.body.prizes : [];
  const data = await gameService.bulkSavePrizes(req.user.id, prizes);
  res.status(httpStatus.OK).json(
    response({ message: "Prizes saved", status: "OK", statusCode: httpStatus.OK, data })
  );
});

// PATCH /venues/me/game/prizes/:prizeId  — update single prize field (e.g. toggle isActive)
const updatePrize = catchAsync(async (req, res) => {
  const data = await gameService.updatePrize(req.user.id, req.params.prizeId, req.body);
  res.status(httpStatus.OK).json(
    response({ message: "Prize updated", status: "OK", statusCode: httpStatus.OK, data })
  );
});

// DELETE /venues/me/game/prizes/:prizeId
const deletePrize = catchAsync(async (req, res) => {
  await gameService.deletePrize(req.user.id, req.params.prizeId);
  res.status(httpStatus.OK).json(
    response({ message: "Prize deleted", status: "OK", statusCode: httpStatus.OK, data: null })
  );
});

// POST /venues/me/game/prizes/:prizeId/reset-wins
const resetPrizeWins = catchAsync(async (req, res) => {
  const data = await gameService.resetPrizeWins(req.user.id, req.params.prizeId);
  res.status(httpStatus.OK).json(
    response({ message: "Win count reset", status: "OK", statusCode: httpStatus.OK, data })
  );
});

module.exports = { getGameConfig, updateGameType, bulkSavePrizes, updatePrize, deletePrize, resetPrizeWins };

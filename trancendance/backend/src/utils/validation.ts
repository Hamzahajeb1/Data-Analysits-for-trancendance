import Joi from 'joi';

// Validation for analytics filters
export const analyticsFilterSchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  userId: Joi.string().uuid().optional(),
  gameType: Joi.string().optional(),
});

// Validation for data import
export const dataImportSchema = Joi.object({
  users: Joi.array().items(
    Joi.object({
      id: Joi.string().uuid().required(),
      username: Joi.string().required(),
      email: Joi.string().email().required(),
      profile_picture: Joi.string().allow(null, '').optional(),
      bio: Joi.string().allow(null, '').optional(),
    })
  ).optional(),
  matches: Joi.array().items(
    Joi.object({
      player1_id: Joi.string().uuid().required(),
      player2_id: Joi.string().uuid().required(),
      score1: Joi.number().required(),
      score2: Joi.number().required(),
      duration: Joi.number().required(),
    })
  ).optional(),
  userStats: Joi.array().items(
    Joi.object({
      user_id: Joi.string().uuid().required(),
      total_wins: Joi.number().required(),
      total_losses: Joi.number().required(),
      level: Joi.number().required(),
      xp: Joi.number().required(),
    })
  ).optional(),
  userActivity: Joi.array().items(
    Joi.object({
      user_id: Joi.string().uuid().required(),
      action: Joi.string().required(),
      timestamp: Joi.date().required(),
    })
  ).optional(),
});

// Validation for GDPR data deletion
export const gdprDeletionSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  confirmationCode: Joi.string().required(),
});

// Validation for data request
export const dataRequestSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});

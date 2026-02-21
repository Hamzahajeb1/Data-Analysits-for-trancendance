import { Request, Response } from 'express';
import { query } from '../models/database';
import { analyticsFilterSchema } from '../utils/validation';

export const getMatchHistory = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId } = req.query;

    let queryStr = `
      SELECT id, player1_id, player2_id, score1, score2, duration, created_at
      FROM matches
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) {
      params.push(startDate + ' 00:00:00');
      queryStr += ` AND created_at >= $${params.length}::timestamp`;
    }

    if (endDate) {
      params.push(endDate + ' 23:59:59');
      queryStr += ` AND created_at <= $${params.length}::timestamp`;
    }

    if (userId) {
      params.push(userId);
      queryStr += ` AND (player1_id = $${params.length} OR player2_id = $${params.length})`;
    }

    queryStr += ` ORDER BY created_at DESC`;

    const result = await query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching match history:', error);
    res.status(500).json({ error: 'Failed to fetch match history' });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    let queryStr = `
      SELECT user_id, total_wins, total_losses, level, xp
      FROM user_stats
      WHERE 1=1
    `;
    const params: any[] = [];

    if (userId) {
      params.push(userId);
      queryStr += ` AND user_id = $${params.length}`;
    }

    const result = await query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, userId } = req.query;

    let queryStr = `
      SELECT user_id, action, timestamp
      FROM user_activity
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) {
      params.push(startDate + ' 00:00:00');
      queryStr += ` AND timestamp >= $${params.length}::timestamp`;
    }

    if (endDate) {
      params.push(endDate + ' 23:59:59');
      queryStr += ` AND timestamp <= $${params.length}::timestamp`;
    }

    if (userId) {
      params.push(userId);
      queryStr += ` AND user_id = $${params.length}`;
    }

    queryStr += ` ORDER BY timestamp DESC`;

    const result = await query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
};

export const getStatsSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let matchesQuery = `
      SELECT COUNT(*) as total_matches,
             AVG(duration) as avg_duration
      FROM matches
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) {
      params.push(startDate + ' 00:00:00');
      matchesQuery += ` AND created_at >= $${params.length}::timestamp`;
    }

    if (endDate) {
      params.push(endDate + ' 23:59:59');
      matchesQuery += ` AND created_at <= $${params.length}::timestamp`;
    }

    const matchResult = await query(matchesQuery, params);

    const userStatsQuery = `
      SELECT COUNT(*) as total_users,
             AVG(total_wins) as avg_wins,
             AVG(total_losses) as avg_losses,
             AVG(level) as avg_level,
             MAX(level) as max_level
      FROM user_stats
    `;

    const userResult = await query(userStatsQuery);

    res.json({
      matches: matchResult.rows[0],
      users: userResult.rows[0],
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error fetching stats summary:', error);
    res.status(500).json({ error: 'Failed to fetch stats summary' });
  }
};

export const getUserRankings = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit || 10;

    const queryStr = `
      SELECT user_id, total_wins, total_losses, level, xp,
             ROUND(100.0 * total_wins / (total_wins + total_losses), 2) as win_rate
      FROM user_stats
      WHERE (total_wins + total_losses) > 0
      ORDER BY level DESC, xp DESC
      LIMIT $1
    `;

    const result = await query(queryStr, [limit]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
};

export const getActivityTrends = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    let queryStr = `
      SELECT DATE(timestamp) as date, action, COUNT(*) as count
      FROM user_activity
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) {
      params.push(startDate + ' 00:00:00');
      queryStr += ` AND timestamp >= $${params.length}::timestamp`;
    }

    if (endDate) {
      params.push(endDate + ' 23:59:59');
      queryStr += ` AND timestamp <= $${params.length}::timestamp`;
    }

    queryStr += ` GROUP BY DATE(timestamp), action ORDER BY date ASC`;

    const result = await query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activity trends:', error);
    res.status(500).json({ error: 'Failed to fetch activity trends' });
  }
};

export const exportAnalytics = async (req: Request, res: Response) => {
  try {
    const { format = 'csv', startDate, endDate } = req.query;

    let matchQueryStr = `
      SELECT id, player1_id, player2_id, score1, score2, duration, created_at
      FROM matches
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) {
      params.push(startDate + ' 00:00:00');
      matchQueryStr += ` AND created_at >= $${params.length}::timestamp`;
    }

    if (endDate) {
      params.push(endDate + ' 23:59:59');
      matchQueryStr += ` AND created_at <= $${params.length}::timestamp`;
    }

    const matchResult = await query(matchQueryStr, params);

    if (format === 'csv') {
      // Generate CSV
      const headers = ['ID', 'Player 1', 'Player 2', 'Score 1', 'Score 2', 'Duration (s)', 'Date'];
      const rows = matchResult.rows.map((match: any) => [
        match.id,
        match.player1_id,
        match.player2_id,
        match.score1,
        match.score2,
        match.duration,
        new Date(match.created_at).toISOString(),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(',')),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
      res.send(csvContent);
    } else if (format === 'pdf') {
      // For PDF, we'll return JSON and let the frontend handle it with a library
      // Or send a simple text representation
      const pdfContent = `
ANALYTICS REPORT
Generated: ${new Date().toISOString()}
Date Range: ${startDate || 'All'} to ${endDate || 'All'}

MATCHES DATA
${matchResult.rows.map((m: any) => `- Match ${m.id}: ${m.player1_id} vs ${m.player2_id} (${m.score1}:${m.score2})`).join('\n')}

Total Matches: ${matchResult.rows.length}
      `.trim();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="analytics.pdf"');
      res.send(pdfContent);
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
};

export const recordMatch = async (req: Request, res: Response) => {
  try {
    const { player1_id, player2_id, score1, score2, duration } = req.body;

    const queryStr = `
      INSERT INTO matches (player1_id, player2_id, score1, score2, duration, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const params = [player1_id, player2_id, score1, score2, duration];

    const result = await query(queryStr, params);
    const newMatch = result.rows[0];

    // Emit real-time update event
    const io = require('../server').getIO();
    io.emit('dashboard-update', { type: 'new_match', data: newMatch });

    res.status(201).json(newMatch);
  } catch (error) {
    console.error('Error recording match:', error);
    res.status(500).json({ error: 'Failed to record match' });
  }
};

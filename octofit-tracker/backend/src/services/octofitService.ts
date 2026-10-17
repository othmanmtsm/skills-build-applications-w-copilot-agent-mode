import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (typeof input !== 'object' || input === null) {
    throw Object.assign(new Error('Activity payload must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;

  if (!userId || !teamId || typeof type !== 'string' || !type.trim() || minutes === undefined || minutes === null) {
    throw Object.assign(new Error('Activity requires userId, teamId, type, and minutes'), { status: 400 });
  }

  const parsedMinutes = Number(minutes);
  if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    throw Object.assign(new Error('Activity minutes must be a positive number'), { status: 400 });
  }

  const userObjectId = String(userId);
  const teamObjectId = String(teamId);

  if (!mongoose.Types.ObjectId.isValid(userObjectId) || !mongoose.Types.ObjectId.isValid(teamObjectId)) {
    throw Object.assign(new Error('User ID and team ID must be valid MongoDB ObjectIds'), { status: 400 });
  }

  const userExists = await User.exists({ _id: userObjectId });
  const teamExists = await Team.exists({ _id: teamObjectId });

  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Referenced user or team was not found'), { status: 400 });
  }

  const activity = await Activity.create({
    user: new mongoose.Types.ObjectId(userObjectId),
    team: new mongoose.Types.ObjectId(teamObjectId),
    type: type.trim(),
    minutes: parsedMinutes,
    points: parsedMinutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (typeof input !== 'object' || input === null) {
    throw Object.assign(new Error('Team payload must be an object'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }

  const memberIds = Array.isArray(members) ? members : [];
  const normalizedMembers: mongoose.Types.ObjectId[] = [];
  for (const member of memberIds) {
    const memberId = String(member);
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      throw Object.assign(new Error('Team member IDs must be valid MongoDB ObjectIds'), { status: 400 });
    }
    normalizedMembers.push(new mongoose.Types.ObjectId(memberId));
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: normalizedMembers,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  if (totals.length === 0) {
    return [];
  }

  const teamIds = totals.map((entry) => entry._id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamNameMap = new Map(teams.map((team) => [String(team._id), team.name]));

  return totals.map((entry, index) => ({
    teamName: teamNameMap.get(String(entry._id)) ?? 'Unknown',
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = String(userEmail ?? '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw Object.assign(new Error('User email is required'), { status: 400 });
  }

  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();

  let focus = typeof user.fitnessGoal === 'string' && user.fitnessGoal.trim() ? user.fitnessGoal.trim() : 'endurance';

  if (recentActivities.length > 0) {
    const counts = new Map<string, number>();

    for (const activity of recentActivities) {
      const type = String(activity.type ?? '').trim();
      if (!type) continue;
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }

    const topActivity = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topActivity) {
      const activityType = topActivity[0].toLowerCase();
      if (activityType.includes('run') || activityType.includes('cycle') || activityType.includes('walk')) {
        focus = 'endurance';
      }
      if (activityType.includes('strength') || activityType.includes('lift') || activityType.includes('press')) {
        focus = 'strength';
      }
    }
  }

  const workouts = await Workout.find({ focus }).sort({ minutes: 1 }).lean();
  if (workouts.length === 0) {
    return [];
  }

  const dominantActivity = recentActivities[0]?.type ?? focus;
  return workouts.map((workout) => ({
    ...workout,
    reason: `${dominantActivity} activity suggests a ${focus} focus and a ${workout.minutes}-minute session.`,
  }));
}

export { User };

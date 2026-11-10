import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(_input: unknown) {
  if (!_input || typeof _input !== 'object' || Array.isArray(_input)) {
    throw Object.assign(new Error('Activity data must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = _input as Record<string, unknown>;
  const objectIdPattern = /^[0-9a-f]{24}$/i;
  if (typeof userId !== 'string' || !objectIdPattern.test(userId)) {
    throw Object.assign(new Error('A valid userId is required'), { status: 400 });
  }
  if (typeof teamId !== 'string' || !objectIdPattern.test(teamId)) {
    throw Object.assign(new Error('A valid teamId is required'), { status: 400 });
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw Object.assign(new Error('An activity type is required'), { status: 400 });
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw Object.assign(new Error('Minutes must be a positive number'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id'),
    Team.findById(teamId).select('_id'),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('The specified user or team does not exist'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  if (!_input || typeof _input !== 'object' || Array.isArray(_input)) {
    throw Object.assign(new Error('Team data must be an object'), { status: 400 });
  }

  const { name, mascot, members = [] } = _input as Record<string, unknown>;
  const objectIdPattern = /^[0-9a-f]{24}$/i;
  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('A team name is required'), { status: 400 });
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('A team mascot is required'), { status: 400 });
  }
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !objectIdPattern.test(member))) {
    throw Object.assign(new Error('Members must be an array of valid user IDs'), { status: 400 });
  }

  const users = members.length ? await User.find({ _id: { $in: members } }).select('_id') : [];
  if (users.length !== members.length) {
    throw Object.assign(new Error('One or more specified users do not exist'), { status: 404 });
  }

  return Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: users.map(({ _id }) => _id),
  });
}

export async function getLeaderboard() {
  const [teams, pointTotals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(pointTotals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map(({ _id, name }) => ({ teamName: name, totalPoints: totalsByTeam.get(_id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).select('_id fitnessGoal').lean();
  if (!user) {
    throw Object.assign(new Error('The specified user does not exist'), { status: 404 });
  }

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean(),
    Workout.find().lean(),
  ]);
  const recentActivity = activities[0]?.type;
  return workouts
    .map((workout) => {
      const matchesGoal = workout.focus.toLowerCase() === user.fitnessGoal.toLowerCase();
      const reason = matchesGoal && recentActivity
        ? `Recommended for your ${user.fitnessGoal} goal and recent ${recentActivity} activity.`
        : matchesGoal
          ? `Recommended for your ${user.fitnessGoal} fitness goal.`
          : recentActivity
            ? `Consider this workout alongside your recent ${recentActivity} activity.`
            : 'A suggested workout to support your fitness routine.';
      return { workout, matchesGoal, reason };
    })
    .sort((left, right) => Number(right.matchesGoal) - Number(left.matchesGoal) || left.workout.title.localeCompare(right.workout.title))
    .map(({ workout, reason }) => ({ ...workout, reason }));
}

export { User };
